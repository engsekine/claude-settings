import { getNextPlanWithProgress } from '@/features/plans/server/queries';

import { NextPlanCardView } from './NextPlanCardView';

export const NextPlanCard = async () => {
    const summary = await getNextPlanWithProgress();
    return <NextPlanCardView summary={summary} />;
};
