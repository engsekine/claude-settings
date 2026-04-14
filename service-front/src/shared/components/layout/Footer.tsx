import { COPYRIGHT_HOLDER } from '@/shared/constants/site';

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-4">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
