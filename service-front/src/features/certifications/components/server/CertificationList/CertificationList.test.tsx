import { render, screen } from '@testing-library/react';

import type { Certification } from '@/features/certifications/types';

import { CertificationList } from './CertificationList';

const TODAY = '2026-06-12';

const buildCertification = (
    overrides: Partial<Certification> & Pick<Certification, 'id' | 'agency' | 'rank' | 'acquiredOn'>,
): Certification => ({
    diverNumber: null,
    instructorNumber: null,
    trainedBy: null,
    acquiredLocation: null,
    dive: null,
    tags: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
});

const padiCert = buildCertification({
    id: 'c1',
    agency: 'padi',
    rank: 'オープンウォーターダイバー',
    acquiredOn: '2023-04-01',
});

const otherCert = buildCertification({
    id: 'c2',
    agency: 'other',
    rank: 'ダイブマスター',
    acquiredOn: '2026-06-12',
});

describe('CertificationList', () => {
    it('0 件時は未登録の案内文を表示する', () => {
        render(<CertificationList certifications={[]} today={TODAY} />);

        expect(screen.getByText('保有資格が登録されていません')).toBeInTheDocument();
    });

    it('0 件時は「資格を登録する」リンクを表示し、登録画面へ遷移する', () => {
        render(<CertificationList certifications={[]} today={TODAY} />);

        const link = screen.getByRole('link', { name: '資格を登録する' });
        expect(link).toHaveAttribute('href', '/settings/certifications/new');
    });

    it('複数件渡すと全件のカードが表示される', () => {
        render(<CertificationList certifications={[padiCert, otherCert]} today={TODAY} />);

        expect(screen.getByRole('heading', { name: 'オープンウォーターダイバー' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'ダイブマスター' })).toBeInTheDocument();
    });

    it('渡した順のまま描画される', () => {
        render(<CertificationList certifications={[padiCert, otherCert]} today={TODAY} />);

        const headings = screen.getAllByRole('heading');
        expect(headings[0]).toHaveTextContent('オープンウォーターダイバー');
        expect(headings[1]).toHaveTextContent('ダイブマスター');
    });

    it('padi は「PADI」と表示される', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.getByText('PADI')).toBeInTheDocument();
    });

    it('other は「その他」と表示される', () => {
        render(<CertificationList certifications={[otherCert]} today={TODAY} />);

        expect(screen.getByText('その他')).toBeInTheDocument();
    });

    it('取得日を YYYY/MM/DD 形式で表示する', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.getByText('2023/04/01')).toBeInTheDocument();
    });

    it('保有期間を正しく表示する（acquiredOn: 2023-04-01 / today: 2026-06-12 → 3年2ヶ月）', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.getByText('3年2ヶ月')).toBeInTheDocument();
    });

    it('取得日と基準日が同じ場合は「0ヶ月」と表示する', () => {
        render(<CertificationList certifications={[otherCert]} today={TODAY} />);

        expect(screen.getByText('0ヶ月')).toBeInTheDocument();
    });

    it('renderActions の戻り値を各カードに描画する', () => {
        render(
            <CertificationList
                certifications={[padiCert, otherCert]}
                today={TODAY}
                renderActions={(cert) => <button type="button">{cert.rank} を削除</button>}
            />,
        );

        expect(screen.getByRole('button', { name: 'オープンウォーターダイバー を削除' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'ダイブマスター を削除' })).toBeInTheDocument();
    });

    it('renderActions が未指定のときは操作エリアを描画しない', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('登録済みの任意項目（ダイバーNo. / インストラクターNo. / 指導者・ショップ / 取得場所）を表示する', () => {
        const detailedCert = buildCertification({
            id: 'c3',
            agency: 'padi',
            rank: 'Rescue Diver',
            acquiredOn: '2024-01-15',
            diverNumber: '1234567890',
            instructorNumber: 'I-98765',
            trainedBy: '石垣島ダイビングショップ',
            acquiredLocation: '沖縄県石垣市',
        });

        render(<CertificationList certifications={[detailedCert]} today={TODAY} />);

        expect(screen.getByText('1234567890')).toBeInTheDocument();
        expect(screen.getByText('I-98765')).toBeInTheDocument();
        expect(screen.getByText('石垣島ダイビングショップ')).toBeInTheDocument();
        expect(screen.getByText('沖縄県石垣市')).toBeInTheDocument();
    });

    it('未登録の任意項目はラベルごと表示しない', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.queryByText('ダイバーNo.')).not.toBeInTheDocument();
        expect(screen.queryByText('指導者・ショップ')).not.toBeInTheDocument();
        expect(screen.queryByText('取得場所')).not.toBeInTheDocument();
    });

    it('スペシャリティタグをタグリストとして表示する', () => {
        const taggedCert = buildCertification({
            id: 'c4',
            agency: 'padi',
            rank: 'Advanced Open Water Diver',
            acquiredOn: '2024-06-01',
            tags: ['エンリッチド・エア', 'ディープ'],
        });

        render(<CertificationList certifications={[taggedCert]} today={TODAY} />);

        const tagList = screen.getByRole('list', { name: 'スペシャリティタグ' });
        expect(tagList).toBeInTheDocument();
        expect(screen.getByText('エンリッチド・エア')).toBeInTheDocument();
        expect(screen.getByText('ディープ')).toBeInTheDocument();
    });

    it('タグが 0 件のときはタグリストを表示しない', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.queryByRole('list', { name: 'スペシャリティタグ' })).not.toBeInTheDocument();
    });

    it('取得ダイブが紐づいている場合はダイブ詳細へのリンクを表示する', () => {
        const linkedCert = buildCertification({
            id: 'c5',
            agency: 'padi',
            rank: 'Open Water Diver',
            acquiredOn: '2024-05-20',
            dive: { id: 'dive-1', diveDate: '2024-05-20', location: '石垣島・米原' },
        });

        render(<CertificationList certifications={[linkedCert]} today={TODAY} />);

        const diveLink = screen.getByRole('link', { name: '2024/05/20 石垣島・米原' });
        expect(diveLink).toHaveAttribute('href', '/dives/dive-1');
    });

    it('取得ダイブが未設定のときはダイブ項目を表示しない', () => {
        render(<CertificationList certifications={[padiCert]} today={TODAY} />);

        expect(screen.queryByText('取得ダイブ')).not.toBeInTheDocument();
    });
});
