import { AuthNav } from '@/features/auth';
import { Footer } from '@/shared/components/layout/Footer';
import { Header } from '@/shared/components/layout/Header';

export default function Home() {
    return (
        <>
            <Header actions={<AuthNav />} />
            <main className="flex flex-1 items-center justify-center bg-background">
                <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Welcome
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        ここにコンテンツを追加してください。
                    </p>
                </div>
            </main>
            <Footer />
        </>
    );
}
