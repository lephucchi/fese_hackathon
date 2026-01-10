/**
 * AddPositionForm - Form to add new stock position
 */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { CreatePositionData } from '@/services/api/portfolio.service';

interface AddPositionFormProps {
    onSubmit: (data: CreatePositionData) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

export function AddPositionForm({ onSubmit, onCancel, isLoading = false }: AddPositionFormProps) {
    const [ticker, setTicker] = useState('');
    const [volume, setVolume] = useState('');
    const [avgBuyPrice, setAvgBuyPrice] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        if (!ticker.trim()) {
            setError('Vui lòng nhập mã cổ phiếu');
            return;
        }
        if (!volume || parseFloat(volume) <= 0) {
            setError('Vui lòng nhập khối lượng hợp lệ');
            return;
        }
        if (!avgBuyPrice || parseFloat(avgBuyPrice) <= 0) {
            setError('Vui lòng nhập giá mua hợp lệ');
            return;
        }

        try {
            await onSubmit({
                ticker: ticker.toUpperCase().trim(),
                volume: parseFloat(volume),
                avg_buy_price: parseFloat(avgBuyPrice),
            });
            // Clear form
            setTicker('');
            setVolume('');
            setAvgBuyPrice('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '8px',
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            style={{
                background: 'var(--card)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border)',
                marginBottom: '16px',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
            }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                }}>
                    Thêm mã cổ phiếu
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {error && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: '14px',
                    marginBottom: '16px',
                }}>
                    {error}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '20px',
            }}>
                {/* Ticker */}
                <div>
                    <label style={labelStyle}>Mã cổ phiếu</label>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="VD: VCB"
                        maxLength={10}
                        style={inputStyle}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                </div>

                {/* Volume */}
                <div>
                    <label style={labelStyle}>Khối lượng</label>
                    <input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="VD: 1000"
                        min="1"
                        step="1"
                        style={inputStyle}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                </div>

                {/* Price */}
                <div>
                    <label style={labelStyle}>Giá mua TB (VNĐ)</label>
                    <input
                        type="number"
                        value={avgBuyPrice}
                        onChange={(e) => setAvgBuyPrice(e.target.value)}
                        placeholder="VD: 65000"
                        min="1"
                        step="100"
                        style={inputStyle}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                </div>
            </div>

            {/* Preview */}
            {ticker && volume && avgBuyPrice && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0, 200, 5, 0.05)',
                    border: '1px solid rgba(0, 200, 5, 0.2)',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                }}>
                    Giá trị: <strong style={{ color: 'var(--primary)' }}>
                        {new Intl.NumberFormat('vi-VN').format(parseFloat(volume) * parseFloat(avgBuyPrice))} ₫
                    </strong>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Đang thêm...
                    </>
                ) : (
                    <>
                        <Plus size={18} />
                        Thêm vào danh mục
                    </>
                )}
            </button>
        </motion.form>
    );
}
