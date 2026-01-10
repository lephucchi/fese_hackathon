/**
 * Synthesis Report Component
 * Responsibility: Display daily market analysis and recommendations
 */
'use client';

import { SynthesisReport } from '@/types/dashboard.types';

interface SynthesisReportProps {
    readonly report: SynthesisReport;
}

interface ReportSection {
    readonly title: string;
    readonly emoji: string;
    readonly items: readonly string[];
}

export function SynthesisReportComponent({ report }: SynthesisReportProps) {
    const sections: readonly ReportSection[] = [
        {
            title: 'Tích cực',
            emoji: '🟢',
            items: report.positiveFactors,
        },
        {
            title: 'Tiêu cực',
            emoji: '🔴',
            items: report.negativeFactors,
        },
        {
            title: 'Góc nhìn AI',
            emoji: '💡',
            items: report.aiRecommendations,
        },
    ];

    return (
        <div className="synthesis-report">
            <h2>Nhận định hôm nay</h2>

            <div className="synthesis-section">
                <h3>📝 Tổng quan</h3>
                <p>{report.overview}</p>
            </div>

            {sections.map((section) => (
                <div key={section.title} className="synthesis-section">
                    <h3>
                        {section.emoji} {section.title}
                    </h3>
                    {section.items.length > 0 ? (
                        <ul>
                            {section.items.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-section">Không có thông tin</p>
                    )}
                </div>
            ))}
        </div>
    );
}
