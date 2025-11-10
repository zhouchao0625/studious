"use client";

import Link from "next/link";
import { useTranslations } from "next-intl"

export function Footer() {
    const t = useTranslations('footer');

    return (
        <>
            {/* Footer */}
            <footer className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 bg-secondary border-t border-border">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
                        <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Studious" className="w-7 h-7" />
                            <span className="text-lg sm:text-xl font-semibold text-foreground">Studious</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('productDescription')}
                        </p>
                        </div>
                        
                        <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('product')}</h3>
                        <ul className="space-y-2">
                            <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('features')}</Link></li>
                            <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('pricing')}</Link></li>
                            <li><Link href="/program" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('schoolProgram')}</Link></li>
                        </ul>
                        </div>
                        
                        <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('company')}</h3>
                        <ul className="space-y-2">
                            <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('about')}</Link></li>
                            <li><Link href="#team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('team')}</Link></li>
                            <li><Link href="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('press')}</Link></li>
                        </ul>
                        </div>
                        
                        <div>
                        <h3 className="font-semibold text-foreground mb-4">{t('contact')}</h3>
                        <ul className="space-y-2">
                            <li><a href="mailto:hello@studious.sh" className="text-sm text-muted-foreground hover:text-foreground transition-colors">hello@studious.sh</a></li>
                            <li><a href="mailto:press@studious.sh" className="text-sm text-muted-foreground hover:text-foreground transition-colors">press@studious.sh</a></li>
                            <li><a href="mailto:impact@studious.sh" className="text-sm text-muted-foreground hover:text-foreground transition-colors">impact@studious.sh</a></li>
                        </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            {t('copyright')}
                        </p>
                        <div className="flex gap-6">
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {t('privacyPolicy')}
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {t('termsOfService')}
                        </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
