'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export interface NewsCard {
    id: string;
    title: string;
    tag: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    summary: string;
    imageUrl?: string;
}

interface SwipeCardStackProps {
    cards: NewsCard[];
    onSwipeLeft: (card: NewsCard) => void;
    onSwipeRight: (card: NewsCard) => void;
    onStackEmpty: () => void;
}

export function SwipeCardStack({ cards, onSwipeLeft, onSwipeRight, onStackEmpty }: SwipeCardStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [exitX, setExitX] = useState(0);

    const currentCard = cards[currentIndex];
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 100) {
            const direction = info.offset.x > 0 ? 1 : -1;
            setExitX(direction * 500);

            setTimeout(() => {
                if (direction === 1) {
                    onSwipeRight(currentCard);
                } else {
                    onSwipeLeft(currentCard);
                }

                if (currentIndex === cards.length - 1) {
                    onStackEmpty();
                } else {
                    setCurrentIndex(currentIndex + 1);
                    setExitX(0);
                }
            }, 200);
        }
    };

    const handleButtonClick = (direction: 'left' | 'right') => {
        setExitX(direction === 'right' ? 500 : -500);

        setTimeout(() => {
            if (direction === 'right') {
                onSwipeRight(currentCard);
            } else {
                onSwipeLeft(currentCard);
            }

            if (currentIndex === cards.length - 1) {
                onStackEmpty();
            } else {
                setCurrentIndex(currentIndex + 1);
                setExitX(0);
            }
        }, 200);
    };

    if (!currentCard) {
        return null;
    }

    const sentimentColor = {
        positive: 'var(--success)',
        negative: 'var(--error)',
        neutral: 'var(--text-secondary)'
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '700px',
            margin: '0 auto'
        }}>
            {/* Left Arrow Button - Bỏ qua */}
            <button
                onClick={() => handleButtonClick('left')}
                className="interactive-scale"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: '2px solid var(--error)',
                    background: 'var(--card)',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'all 0.2s',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.color = 'var(--error)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <ChevronLeft size={28} strokeWidth={3} />
            </button>

            {/* Card Container */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                {/* Card Stack Background (Next cards) */}
                {cards.slice(currentIndex + 1, currentIndex + 3).map((card, index) => (
                    <div
                        key={card.id}
                        style={{
                            position: 'absolute',
                            top: `${(index + 1) * 8}px`,
                            left: '50%',
                            transform: `translateX(-50%) scale(${1 - (index + 1) * 0.05})`,
                            width: '100%',
                            height: '480px',
                            background: 'var(--card)',
                            borderRadius: '24px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: cards.length - index - 1,
                            opacity: 1 - (index + 1) * 0.3
                        }}
                    />
                ))}

                {/* Current Card */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{
                        x: exitX ? exitX : x,
                        rotate,
                        opacity,
                        position: 'relative',
                        width: '100%',
                        height: '480px',
                        background: 'var(--card)',
                        borderRadius: '24px',
                        boxShadow: 'var(--shadow-xl)',
                        cursor: 'grab',
                        zIndex: cards.length,
                        overflow: 'hidden'
                    }}
                    onDragEnd={handleDragEnd}
                    whileTap={{ cursor: 'grabbing' }}
                    animate={{ x: exitX, opacity: exitX ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Swipe Indicators */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            left: '2rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 90, 95, 0.9)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]),
                            zIndex: 10
                        }}
                    >
                        BỎ QUA
                    </motion.div>

                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            background: 'rgba(0, 200, 5, 0.9)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]),
                            zIndex: 10
                        }}
                    >
                        QUAN TÂM
                    </motion.div>

                    {/* Card Content */}
                    <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Tag and Sentiment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <span className="badge-pill" style={{
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}>
                                {currentCard.tag}
                            </span>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: sentimentColor[currentCard.sentiment]
                            }} />
                        </div>

                        {/* Title */}
                        <h3 style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            marginBottom: '1.5rem',
                            lineHeight: 1.3,
                            color: 'var(--text-primary)'
                        }}>
                            {currentCard.title}
                        </h3>

                        {/* Summary */}
                        <p style={{
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: 'var(--text-secondary)',
                            flex: 1,
                            overflow: 'auto'
                        }}>
                            {currentCard.summary}
                        </p>

                        {/* Card Counter */}
                        <div style={{
                            marginTop: '1.5rem',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            color: 'var(--text-tertiary)',
                            fontWeight: 600
                        }}>
                            {currentIndex + 1} / {cards.length}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Arrow Button - Quan tâm */}
            <button
                onClick={() => handleButtonClick('right')}
                className="interactive-scale"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0, 200, 5, 0.3)',
                    transition: 'all 0.2s',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 200, 5, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 200, 5, 0.3)';
                }}
            >
                <ChevronRight size={28} strokeWidth={3} />
            </button>
        </div>
    );
}
