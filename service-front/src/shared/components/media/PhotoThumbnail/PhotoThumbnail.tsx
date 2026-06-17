import Image from 'next/image';

interface PhotoThumbnailProps {
    /** 表示する画像 URL（Supabase Storage の署名 URL 等） */
    src: string;
    /** 代替テキスト（必須）。装飾画像でないため空文字は想定しない */
    alt: string;
    /** 元画像の幅（px）。判明していればレイアウトシフトを防ぐ */
    width?: number | null;
    /** 元画像の高さ（px）。判明していればレイアウトシフトを防ぐ */
    height?: number | null;
    /** 一覧の最初の 1 枚など、先読みしたい場合のみ true（既定は遅延読込） */
    priority?: boolean;
    /**
     * Next.js の画像最適化を経由せずブラウザが src を直接読み込む。
     * Supabase Storage の署名 URL（リクエスト毎に変わりキャッシュが効かない / 既に sharp で適正サイズ済み）や、
     * dev の Docker で optimizer がホストの URL に到達できないケースで使う。
     */
    unoptimized?: boolean;
    /** 追加クラス（サイズ・角丸など利用側で調整） */
    className?: string;
}

/**
 * next/image の薄いラッパ（Server Component）。
 * alt を必須にして装飾でない画像の代替テキスト欠落を型レベルで防ぐ（accessibility.md / FR-009 系）。
 * 寸法が判明していれば width/height を渡し、不明なら 1:1 のボックスに fill で収める。
 */
export const PhotoThumbnail = ({
    src,
    alt,
    width,
    height,
    priority = false,
    unoptimized = false,
    className,
}: PhotoThumbnailProps) => {
    const hasIntrinsicSize = typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0;

    if (hasIntrinsicSize) {
        return (
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                priority={priority}
                unoptimized={unoptimized}
                className={className ?? 'h-auto w-full rounded-md object-cover'}
            />
        );
    }

    return (
        <span className={className ?? 'relative block aspect-square w-full overflow-hidden rounded-md'}>
            <Image src={src} alt={alt} fill priority={priority} unoptimized={unoptimized} className="object-cover" />
        </span>
    );
};
