import { Check, Copy, Download, Link2, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { copyTextToClipboard } from '../utils/format';
import type { PublicTab } from './Header';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: PublicTab;
  highlightRoom?: string;
}

const TARGET_INFO: Record<
  PublicTab,
  { label: string; title: string; desc: string }
> = {
  fill: {
    label: '邀请填写问卷',
    title: '利安花园物业处置方案业主调查问卷',
    desc: '邀请本小区业主扫码或点击链接参与「一户一票」实名问卷表决',
  },
  stats: {
    label: '实时结果公示',
    title: '利安花园物业处置民意实时统计看板',
    desc: '公开实时票数统计、法定门槛进度及业主意见交叉分析',
  },
  list: {
    label: '业主提交记录',
    title: '利安花园业主问卷提交备案公示',
    desc: '查阅已确权业主提交记录与区块链存证哈希溯源',
  },
};

export function ShareSheet({
  isOpen,
  onClose,
  defaultTarget = 'fill',
  highlightRoom,
}: ShareSheetProps) {
  const [target, setTarget] = useState<PublicTab>(defaultTarget);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTarget(defaultTarget);
      setCopied(false);
    }
  }, [isOpen, defaultTarget]);

  const buildShareUrl = (tab: PublicTab) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('tab', tab);
    if (highlightRoom && tab === 'list') {
      url.searchParams.set('search', highlightRoom);
    }
    return url.toString();
  };

  const shareUrl = buildShareUrl(target);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#00288e',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadPoster = async () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 750;
    canvas.height = 1040;
    const ctx = canvas.getContext('2d')!;
    const font = '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", sans-serif';

    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, 750, 1040);

    // Top civic banner
    ctx.fillStyle = '#00288e';
    ctx.fillRect(0, 0, 750, 250);

    ctx.fillStyle = '#85f8c4';
    ctx.beginPath();
    ctx.roundRect(48, 44, 152, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#002114';
    ctx.font = `700 17px ${font}`;
    ctx.fillText('业委会官方认证', 64, 67);

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 34px ${font}`;
    ctx.fillText('利安花园业主表决平台', 48, 128);
    ctx.fillStyle = '#dbe1ff';
    ctx.font = `500 22px ${font}`;
    ctx.fillText(TARGET_INFO[target].title, 48, 174);
    ctx.fillStyle = '#a8b8ff';
    ctx.font = `400 18px ${font}`;
    ctx.fillText('一户一票实名备案 · 全程可溯源公证', 48, 214);

    // White QR card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(48, 286, 654, 620, 28);
    ctx.fill();
    ctx.strokeStyle = '#dce9ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const img = new Image();
    img.src = qrDataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    ctx.drawImage(img, 195, 336, 360, 360);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b1c30';
    ctx.font = `700 24px ${font}`;
    ctx.fillText('微信扫码或长按识别进入', 375, 744);
    ctx.fillStyle = '#444653';
    ctx.font = `400 18px ${font}`;
    ctx.fillText(TARGET_INFO[target].desc.slice(0, 28), 375, 784);
    ctx.fillStyle = '#006c4a';
    ctx.font = `600 17px ${font}`;
    ctx.fillText('《民法典》第278条法定规则认证 · 利安花园业主大会秘书处', 375, 850);

    ctx.fillStyle = '#757684';
    ctx.font = `400 16px ${font}`;
    ctx.fillText(`分享链接：${shareUrl.slice(0, 56)}${shareUrl.length > 56 ? '...' : ''}`, 375, 964);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `利安花园_${TARGET_INFO[target].label}_分享海报.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/45 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle & Header */}
        <div className="relative px-4 pt-3 pb-3 bg-surface-container-low flex items-center justify-between">
          <div className="w-10 h-1 rounded-full bg-outline-variant absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="text-[16px] font-semibold text-on-surface">
              分享问卷与实时公示链接
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Target Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container rounded-xl">
            {(['fill', 'stats', 'list'] as PublicTab[]).map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setTarget(tabKey);
                  setCopied(false);
                }}
                className={`py-2 px-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  target === tabKey
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {TARGET_INFO[tabKey].label}
              </button>
            ))}
          </div>

          {/* QR Code Card */}
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center text-center gap-2.5">
            <div className="p-2.5 bg-surface-container-lowest rounded-xl shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="问卷分享二维码"
                  className="w-40 h-40 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-outline text-xs">
                  生成二维码中...
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold text-on-surface">
                {TARGET_INFO[target].title}
              </p>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                {TARGET_INFO[target].desc}
              </p>
            </div>
          </div>

          {/* URL Copy Box */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-on-surface-variant flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>直达链接（可粘贴至微信业主群）</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-[12px] text-on-surface font-mono focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`h-11 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  copied
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary text-on-primary active:scale-95'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制' : '复制链接'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface text-[14px] font-medium cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={handleDownloadPoster}
            className="flex-[2] h-11 rounded-lg bg-primary-container text-on-primary text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>保存二维码海报图</span>
          </button>
        </div>
      </div>
    </div>
  );
}
