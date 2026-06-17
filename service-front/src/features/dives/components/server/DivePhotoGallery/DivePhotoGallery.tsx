import type { DivePhotoView } from '@/features/dives/types';
import { PhotoThumbnail } from '@/shared/components/media/PhotoThumbnail';

interface DivePhotoGalleryProps {
    /** 表示順に並んだ写真（署名 URL 解決済み）。0 枚なら何も描画しない */
    photos: DivePhotoView[];
}

/**
 * ダイブログの写真ギャラリー（Server Component / presentational）。
 * データ取得は呼び出し側（ページ）が `getDivePhotos` で行い、ここは表示のみ。
 * 詳細ページ・公開ページの双方で再利用する。
 */
export const DivePhotoGallery = ({ photos }: DivePhotoGalleryProps) => {
    if (photos.length === 0) return null;

    return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
                <li key={photo.id} className="flex flex-col gap-1">
                    {/* 一覧はサムネイルを正方形で。元画像は新規タブで開ける */}
                    <a
                        href={photo.displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                        <PhotoThumbnail src={photo.thumbUrl} alt={photo.alt} />
                    </a>
                    {photo.caption && <p className="text-muted-foreground text-xs">{photo.caption}</p>}
                </li>
            ))}
        </ul>
    );
};
