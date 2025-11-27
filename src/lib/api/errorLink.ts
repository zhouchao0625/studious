import { AppRouter } from "@studious-lms/server";
import { TRPCClientError, TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

const needsAuth = (currentLocation: string) => {
    const AUTHED_PATHS = ['/home', '/class', '/profile', '/agenda', '/chat']
    return AUTHED_PATHS.some(path => currentLocation.includes(path));
}

// Error severity levels for Sentry
const getErrorSeverity = (code?: string, httpStatus?: number): 'error' | 'warning' | 'info' => {
    if (code === 'UNAUTHORIZED' || httpStatus === 401) return 'warning';
    if (code === 'FORBIDDEN' || httpStatus === 403) return 'warning';
    if (code === 'NOT_FOUND' || httpStatus === 404) return 'info';
    return 'error';
};

export const errorLink = (): TRPCLink<AppRouter> => {
    return () => {
        return ({ op, next }) => {
            return observable((observer) => {
                const subscription = next(op).subscribe({
                    next(value) {
                        observer.next(value);
                    },
                    error(err) {
                        const error = err as TRPCClientError<AppRouter>;
                        const severity = getErrorSeverity(error.data?.code, error.data?.httpStatus);
                        
                        // Check both error code and HTTP status for 401
                        const isUnauthorized = error.data?.code === 'UNAUTHORIZED' || error.data?.httpStatus === 401;
                        const isForbidden = error.data?.code === 'FORBIDDEN' || error.data?.httpStatus === 403;
                        const isNotFound = error.data?.code === 'NOT_FOUND' || error.data?.httpStatus === 404;
                        const isRateLimited = error.data?.code === 'TOO_MANY_REQUESTS' || error.data?.httpStatus === 429;

                        switch (true) {
                            case isUnauthorized:
                                if (typeof window !== 'undefined' && needsAuth(window.location.href)) {
                                    window.location.href = '/login';
                                }
                                toast.error("You are signed out, please sign in again.");
                                break;
                            case isForbidden:
                                toast.error("The requested resource is forbidden.");
                                toast.error(error.data?.path);
                                break;
                            case isNotFound:
                                toast.error("The requested resource was not found.");
                                break;
                            case isRateLimited:
                                toast.error("Too many requests. Please wait a moment and try again.");
                                // pass through to log to Sentry
                            default:
                                Sentry.captureException(error, {
                                    level: severity,
                                    tags: {
                                        path: op.path,
                                        code: error.data?.code,
                                        httpStatus: error.data?.httpStatus,
                                    },
                                    extra: {
                                        message: error.message,
                                        data: error.data,
                                    },
                                });
                                toast.error("An error occurred, please try again later.");
                                break;
                        }

                        observer.error(err);
                    },
                    complete() {
                        observer.complete();
                    },
                });

                return () => {
                    subscription.unsubscribe();
                };
            });
        };
    };
};
