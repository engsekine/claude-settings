import Link from 'next/link';
import type { ReactNode } from 'react';
import { Heading } from '@/shared/components/typography/Heading';
import { buttonVariants } from '@/shared/components/ui/Button';

import type { GuideSection } from '../../types';

interface GuideSectionCardProps {
    section: GuideSection;
    /** 実 UI の例示表示（表示専用に限る）。feature 間 import 禁止のため app 層から注入する */
    example?: ReactNode;
}

/**
 * 使い方ページの 1 セクション（FR-002 / FR-004 / FR-008 / FR-009）。
 * 見出しの id は目次アンカー（#<id>）のジャンプ先を兼ねる。
 * 手順は ol で番号の意味を持たせ、装飾の番号バッジは aria-hidden にする。
 */
export const GuideSectionCard = ({ section, example }: GuideSectionCardProps) => {
    return (
        <section aria-labelledby={section.id} className="flex flex-col gap-4">
            <Heading level={2} id={section.id}>
                {section.title}
            </Heading>
            <p className="text-muted-foreground text-sm">{section.description}</p>
            <ol className="flex flex-col gap-3">
                {section.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-4 rounded-lg border border-border bg-background p-4">
                        <span
                            aria-hidden="true"
                            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1649b1] font-bold text-sm text-white"
                        >
                            {index + 1}
                        </span>
                        <div className="flex flex-col gap-1">
                            <Heading level={3}>{step.title}</Heading>
                            <p className="text-muted-foreground text-sm">{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>
            {example}
            <div className="flex flex-wrap items-center gap-3">
                {section.links.map((link, index) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={buttonVariants({ variant: index === 0 ? 'default' : 'outline' })}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </section>
    );
};
