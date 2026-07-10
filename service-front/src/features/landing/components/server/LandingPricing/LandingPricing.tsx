/**
 * 料金セクション（031 / FR-005）。
 * 価格・枠数はハードコードせず props で受け取る。値の唯一の情報源は
 * features/credits の定数で、feature 間 import を避けるため page.tsx（app 層）が注入する。
 */
interface LandingPricingProps {
    /** ログパックで付与される枠数（LOG_CREDIT_PACK.quantity） */
    packQuantity: number;
    /** ログパックの税込価格（円 / LOG_CREDIT_PACK.amountJpy） */
    packAmountJpy: number;
    /** 新規登録時の初期無料枠（INITIAL_GRANT_AMOUNT） */
    initialGrantAmount: number;
    /** デイリーボーナスの 1 日あたり付与枠（DAILY_BONUS_AMOUNT） */
    dailyBonusAmount: number;
}

/** 円を「1,000 円」形式にする（3 桁区切り） */
const formatJpy = (amount: number): string => `${amount.toLocaleString('ja-JP')} 円`;

export const LandingPricing = ({
    packQuantity,
    packAmountJpy,
    initialGrantAmount,
    dailyBonusAmount,
}: LandingPricingProps) => {
    return (
        <section aria-labelledby="landing-pricing-title" className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2
                id="landing-pricing-title"
                className="mb-4 text-center font-bold text-2xl text-foreground tracking-tight sm:text-3xl"
            >
                料金
            </h2>
            <p className="mb-12 text-center text-muted-foreground text-sm sm:text-base">
                基本無料で使えます。もっと記録したくなったら、必要な分だけ買い足せます。
            </p>
            <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-6">
                    <h3 className="font-semibold text-foreground text-lg">無料ではじめる</h3>
                    <p className="font-bold text-3xl text-foreground">0 円</p>
                    <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
                        <li>登録時にログ枠 {initialGrantAmount} 枠をプレゼント</li>
                        <li>毎日ログインで +{dailyBonusAmount} 枠</li>
                        <li>記録・統計・予定・タイムラインのすべての機能が使えます</li>
                    </ul>
                </div>
                {/* おすすめカードのアクセントは border-primary で表す。bg-primary/5 の着色背景だと
                    text-muted-foreground がコントラスト 4.5:1 未満（AA 未達）になるため背景は着色しない */}
                <div className="flex flex-col gap-3 rounded-xl border-2 border-primary/50 bg-background p-6">
                    <h3 className="font-semibold text-foreground text-lg">ログパック</h3>
                    <p className="font-bold text-3xl text-foreground">
                        {formatJpy(packAmountJpy)}
                        <span className="ml-1 font-normal text-base text-muted-foreground">/ {packQuantity} 枠</span>
                    </p>
                    <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
                        <li>ログ枠を {packQuantity} 枠まとめて追加</li>
                        <li>買い切りなので月額料金はかかりません</li>
                        <li>枠が足りなくなったら必要なときに購入できます</li>
                    </ul>
                </div>
            </div>
        </section>
    );
};
