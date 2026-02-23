import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import QRCodeStyling, {
    DotType, CornerSquareType, CornerDotType
} from 'qr-code-styling';
import jsPDF from 'jspdf';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    IconQrcode, IconDownload, IconPhoto, IconPalette,
    IconTrash, IconFileTypePdf, IconTypography,
    IconResize, IconLink, IconSparkles, IconCopy,
    IconWifi, IconMail, IconPhone, IconMessage,
    IconLetterCase, IconDeviceFloppy,
    IconDotsVertical, IconList
} from '@tabler/icons-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
type QRType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const COLOR_PRESETS = [
    { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
    { name: 'Ocean', fg: '#0F4C75', bg: '#BBE1FA' },
    { name: 'Sunset', fg: '#C62368', bg: '#FFF0F5' },
    { name: 'Forest', fg: '#1B5E20', bg: '#E8F5E9' },
    { name: 'Royal', fg: '#4A148C', bg: '#F3E5F5' },
    { name: 'Midnight', fg: '#E0E0E0', bg: '#1A1A2E' },
    { name: 'Amber', fg: '#E65100', bg: '#FFF8E1' },
    { name: 'Slate', fg: '#37474F', bg: '#ECEFF1' },
];

const QR_TYPES: { value: QRType; label: string; icon: any }[] = [
    { value: 'url', label: 'URL', icon: IconLink },
    { value: 'text', label: 'Text', icon: IconLetterCase },
    { value: 'wifi', label: 'WiFi', icon: IconWifi },
    { value: 'email', label: 'Email', icon: IconMail },
    { value: 'phone', label: 'Phone', icon: IconPhone },
    { value: 'sms', label: 'SMS', icon: IconMessage },
];

const DOT_STYLES: { value: DotType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dots', label: 'Dots' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'extra-rounded', label: 'Extra Rounded' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Rounded' },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
    { value: 'extra-rounded', label: 'Rounded' },
];

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Build encoded value from type-specific fields
// ═══════════════════════════════════════════════════════════════════════════
function buildQRValue(type: QRType, fields: Record<string, string>): string {
    switch (type) {
        case 'url': return fields.url || 'https://example.com';
        case 'text': return fields.text || '';
        case 'wifi': {
            const enc = fields.encryption || 'WPA';
            return `WIFI:T:${enc};S:${fields.ssid || ''};P:${fields.password || ''};;`;
        }
        case 'email': {
            let mailto = `mailto:${fields.email || ''}`;
            const params: string[] = [];
            if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
            if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`);
            if (params.length) mailto += '?' + params.join('&');
            return mailto;
        }
        case 'phone': return `tel:${fields.phone || ''}`;
        case 'sms': return `SMSTO:${fields.phone || ''}:${fields.message || ''}`;
        default: return '';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const QRCodeGenerator = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const qrRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeInstance = useRef<QRCodeStyling | null>(null);

    // ── QR settings ────────────────────────────────────────────────────
    const [qrType, setQrType] = useState<QRType>('url');
    const [fields, setFields] = useState<Record<string, string>>({ url: 'https://example.com' });
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [label, setLabel] = useState('');
    const [labelFontSize, setLabelFontSize] = useState(16);
    const [labelPosition, setLabelPosition] = useState<'below' | 'above'>('below');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [qrSize, setQrSize] = useState(280);
    const [dotStyle, setDotStyle] = useState<DotType>('square');
    const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareType>('square');
    const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>('square');
    const [activePreset, setActivePreset] = useState(0);
    const [exportingPNG, setExportingPNG] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [savingQR, setSavingQR] = useState(false);

    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => { dispatch(setPageTitle(id ? 'Edit QR Code' : 'Create QR Code')); }, [dispatch, id]);

    // ── Fetch Existing Data (Edit Mode) ────────────────────────────────
    useEffect(() => {
        if (!id) return;
        setLoadingData(true);
        api.get(`/qr-codes/${id}`).then(res => {
            const data = res.data.qr_code;
            setSaveName(data.name);
            setQrType(data.type);
            setFields(data.type === 'url' ? { url: data.content } : { text: data.content }); // Basic mapping, adjust as needed for other types
            // For complex types, you might need to parse `data.content` if you didn't store structured data. 
            // Assuming `data.content` holds the raw QR value, we might need a way to reverse-engineer fields or store fields in settings.
            // A better approach for the future: store `fields` in `settings` or a separate JSON column.
            // CURRENT WORKAROUND: If simple types, just set content. If complex, might be tricky without parsing.
            // Let's assume we can map back for URL/Text easily.

            if (data.settings) {
                const s = data.settings;
                if (s.fgColor) setFgColor(s.fgColor);
                if (s.bgColor) setBgColor(s.bgColor);
                if (s.dotStyle) setDotStyle(s.dotStyle);
                if (s.cornerSquareStyle) setCornerSquareStyle(s.cornerSquareStyle);
                if (s.cornerDotStyle) setCornerDotStyle(s.cornerDotStyle);
                if (s.label) setLabel(s.label);
                if (s.labelFontSize) setLabelFontSize(s.labelFontSize);
                if (s.labelPosition) setLabelPosition(s.labelPosition);
                if (s.qrSize) setQrSize(s.qrSize);
                if (s.logo) setLogoPreview(s.logo); // Restore logo
            }
        }).catch(() => toast.error('Failed to load QR code'))
            .finally(() => setLoadingData(false));
    }, [id]);



    // ── QR Code Styling instance ───────────────────────────────────────
    const qrValue = buildQRValue(qrType, fields);

    useEffect(() => {
        if (!qrRef.current) return;
        qrRef.current.innerHTML = '';
        qrCodeInstance.current = new QRCodeStyling({
            width: qrSize,
            height: qrSize,
            data: qrValue || ' ',
            dotsOptions: { type: dotStyle, color: fgColor },
            backgroundOptions: { color: bgColor },
            cornersSquareOptions: { type: cornerSquareStyle, color: fgColor },
            cornersDotOptions: { type: cornerDotStyle, color: fgColor },
            imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
            image: logoPreview || undefined,
            qrOptions: { errorCorrectionLevel: logoPreview ? 'H' : 'M' },
        });
        qrCodeInstance.current.append(qrRef.current);
    }, [qrValue, fgColor, bgColor, qrSize, dotStyle, cornerSquareStyle, cornerDotStyle, logoPreview]);

    // ── Handlers ───────────────────────────────────────────────────────
    const updateField = (key: string, val: string) => setFields(prev => ({ ...prev, [key]: val }));

    const handleTypeChange = (type: QRType) => {
        setQrType(type);
        setFields(type === 'url' ? { url: 'https://example.com' } : {});
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setLogoFile(null); setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const applyPreset = (i: number) => {
        setActivePreset(i); setFgColor(COLOR_PRESETS[i].fg); setBgColor(COLOR_PRESETS[i].bg);
    };

    const copyValue = useCallback(() => {
        navigator.clipboard.writeText(qrValue).then(() => toast.success('Copied to clipboard'));
    }, [qrValue]);

    // ── Export ──────────────────────────────────────────────────────────
    const captureQR = async (scale = 4): Promise<HTMLCanvasElement> => {
        if (!qrCodeInstance.current) throw new Error('No QR element');

        const qrBlob = await qrCodeInstance.current.getRawData('png');
        if (!qrBlob) throw new Error('Failed to get QR data');
        const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(qrBlob);
        });

        const padding = 24 * scale;
        const qrW = qrSize * scale;
        const qrH = qrSize * scale;

        let labelH = 0;
        const labelGap = label ? 14 * scale : 0;
        const fontSize = labelFontSize * scale;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        const maxLabelW = qrW;

        const labelLines: string[] = [];
        if (label) {
            const words = label.split(' ');
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (tempCtx.measureText(testLine).width > maxLabelW && currentLine) {
                    labelLines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) labelLines.push(currentLine);
            const lineHeight = fontSize * 1.3;
            labelH = labelLines.length * lineHeight;
        }

        const totalW = qrW + padding * 2;
        const totalH = qrH + padding * 2 + (label ? labelH + labelGap : 0);

        const canvas = document.createElement('canvas');
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, totalW, totalH);

        let qrY = padding;
        let labelY = padding;
        const lineHeight = fontSize * 1.3;

        if (label && labelPosition === 'above') {
            labelY = padding;
            qrY = padding + labelH + labelGap;
        } else if (label && labelPosition === 'below') {
            qrY = padding;
            labelY = padding + qrH + labelGap;
        }

        ctx.drawImage(qrImg, padding, qrY, qrW, qrH);
        URL.revokeObjectURL(qrImg.src);

        if (label && labelLines.length > 0) {
            ctx.fillStyle = fgColor;
            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const centerX = totalW / 2;
            for (let i = 0; i < labelLines.length; i++) {
                ctx.fillText(labelLines[i], centerX, labelY + i * lineHeight);
            }
        }

        return canvas;
    };

    const downloadPNG = async () => {
        setExportingPNG(true);
        try {
            const canvas = await captureQR(4);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch { /* silently fail */ }
        finally { setExportingPNG(false); }
    };

    const downloadPDF = async () => {
        setExportingPDF(true);
        try {
            const canvas = await captureQR(4);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageW / canvas.width, pageH / canvas.height) * 0.6;
            const w = canvas.width * ratio, h = canvas.height * ratio;
            pdf.addImage(imgData, 'PNG', (pageW - w) / 2, (pageH - h) / 3, w, h);
            pdf.save(`qr-code-${Date.now()}.pdf`);
        } catch { /* silently fail */ }
        finally { setExportingPDF(false); }
    };


    // ── Helper: File to Base64 ─────────────────────────────────────────
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // ── API: Save QR ───────────────────────────────────────────────────
    const saveQRCode = async () => {
        if (!saveName.trim()) { toast.error('Enter a name for your QR code'); return; }
        if (savingQR) return;
        setSavingQR(true);
        try {
            // Prepare Logo
            let logoData = undefined;
            if (logoFile) {
                logoData = await fileToBase64(logoFile);
            } else if (logoPreview && logoPreview.startsWith('data:')) {
                // Keep existing Base64 logo if not replaced
                logoData = logoPreview;
            }

            const payload = {
                name: saveName,
                type: qrType,
                content: qrValue,
                settings: {
                    fgColor, bgColor, dotStyle, cornerSquareStyle, cornerDotStyle,
                    label, labelFontSize, labelPosition, qrSize,
                    logo: logoData, // Add logo to settings
                },
            };

            if (id) {
                await api.put(`/qr-codes/${id}`, payload);
                toast.success('QR code updated!');
            } else {
                await api.post('/qr-codes', payload);
                toast.success('QR code saved!');
                setSaveName('');
            }
        } catch { toast.error('Failed to save'); }
        finally { setSavingQR(false); }
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Type-specific input fields
    // ═══════════════════════════════════════════════════════════════════
    const renderTypeFields = () => {
        switch (qrType) {
            case 'url':
                return (
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">URL</Label>
                        <div className="flex gap-2">
                            <Input value={fields.url || ''} onChange={e => updateField('url', e.target.value)} placeholder="https://example.com" className="pr-10 text-sm" />
                            <Button variant="secondary" onClick={copyValue}><IconCopy size={16} /></Button>
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Text Content</Label>
                        <textarea value={fields.text || ''} onChange={e => updateField('text', e.target.value)} placeholder="Enter text to encode..." rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                );
            case 'wifi':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Network Name (SSID)</Label>
                            <Input value={fields.ssid || ''} onChange={e => updateField('ssid', e.target.value)} placeholder="MyWiFi" className="h-10 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Password</Label>
                            <Input type="password" value={fields.password || ''} onChange={e => updateField('password', e.target.value)} placeholder="••••••••" className="h-10 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Encryption</Label>
                            <div className="flex gap-2">
                                {['WPA', 'WEP', 'nopass'].map(enc => (
                                    <button key={enc} onClick={() => updateField('encryption', enc)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${(fields.encryption || 'WPA') === enc ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                                        {enc === 'nopass' ? 'None' : enc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'email':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Email Address</Label>
                            <Input value={fields.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="user@example.com" className="h-10 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Subject</Label>
                            <Input value={fields.subject || ''} onChange={e => updateField('subject', e.target.value)} placeholder="Subject line" className="h-10 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Body</Label>
                            <textarea value={fields.body || ''} onChange={e => updateField('body', e.target.value)} placeholder="Message body..." rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                    </div>
                );
            case 'phone':
                return (
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Phone Number</Label>
                        <Input value={fields.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+1 234 567 890" className="h-10 text-sm" />
                    </div>
                );
            case 'sms':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Phone Number</Label>
                            <Input value={fields.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+1 234 567 890" className="h-10 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Message</Label>
                            <textarea value={fields.message || ''} onChange={e => updateField('message', e.target.value)} placeholder="Pre-filled message..." rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                    </div>
                );
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════
    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                            <IconQrcode size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{id ? 'Edit QR Code' : 'Create QR Code'}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Design & customize your QR code</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/apps/qr-code/list')} className="gap-2">
                        <IconList size={16} /> My QR Codes
                    </Button>
                </div>
            </div>

            {/* Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── LEFT: Controls (3 cols) ──────────────────────────────── */}
                <div className="lg:col-span-3 space-y-5">
                    {/* QR Type Selector */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconQrcode size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">QR Code Type</span>
                        </div>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                                {QR_TYPES.map(t => (
                                    <button key={t.value} onClick={() => handleTypeChange(t.value)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${qrType === t.value ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-transparent hover:border-border bg-muted/30'}`}>
                                        <t.icon size={20} className={qrType === t.value ? 'text-primary' : 'text-muted-foreground'} />
                                        <span className={`text-xs font-medium ${qrType === t.value ? 'text-primary' : 'text-muted-foreground'}`}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                            <Separator className="mb-4" />
                            {renderTypeFields()}
                        </CardContent>
                    </Card>

                    {/* Colors */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconPalette size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Colors</span>
                        </div>
                        <CardContent className="p-5 space-y-5">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><IconSparkles size={13} /> Presets</Label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {COLOR_PRESETS.map((p, i) => (
                                        <button key={i} onClick={() => applyPreset(i)} className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${activePreset === i ? 'border-primary shadow-md shadow-primary/20' : 'border-transparent hover:border-border'}`} title={p.name}>
                                            <div className="w-8 h-8 rounded-lg shadow-sm overflow-hidden relative border border-border/50">
                                                <div className="absolute inset-0" style={{ backgroundColor: p.bg }} />
                                                <div className="absolute inset-[30%] rounded-sm" style={{ backgroundColor: p.fg }} />
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground leading-none">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foreground</Label>
                                    <div className="flex items-center gap-2.5">
                                        <input type="color" value={fgColor} onChange={e => { setFgColor(e.target.value); setActivePreset(-1); }} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border bg-transparent p-0.5" />
                                        <Input value={fgColor} onChange={e => { setFgColor(e.target.value); setActivePreset(-1); }} className="h-10 font-mono text-sm uppercase" maxLength={7} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Background</Label>
                                    <div className="flex items-center gap-2.5">
                                        <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setActivePreset(-1); }} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border bg-transparent p-0.5" />
                                        <Input value={bgColor} onChange={e => { setBgColor(e.target.value); setActivePreset(-1); }} className="h-10 font-mono text-sm uppercase" maxLength={7} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pattern */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconDotsVertical size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Pattern</span>
                        </div>
                        <CardContent className="p-5 space-y-5">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Dot Style</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {DOT_STYLES.map(s => (
                                        <button key={s.value} onClick={() => setDotStyle(s.value)} className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${dotStyle === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Corner Square</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CORNER_SQUARE_STYLES.map(s => (
                                        <button key={s.value} onClick={() => setCornerSquareStyle(s.value)} className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${cornerSquareStyle === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Corner Dot</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {CORNER_DOT_STYLES.map(s => (
                                        <button key={s.value} onClick={() => setCornerDotStyle(s.value)} className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${cornerDotStyle === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Label & Logo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Card className="border-border/60 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                                <IconTypography size={16} className="text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">Label</span>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Label Text</Label>
                                    <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Scan Me!" className="h-10 text-sm" maxLength={60} />
                                    <p className="text-[11px] text-muted-foreground mt-1.5">{label.length}/60</p>
                                </div>
                                {label && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Size</Label>
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{labelFontSize}px</span>
                                            </div>
                                            <input type="range" min={12} max={32} step={1} value={labelFontSize} onChange={e => setLabelFontSize(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-gradient-to-r from-primary/20 to-primary/60 cursor-pointer accent-primary" />
                                            <div className="flex justify-between text-[11px] text-muted-foreground mt-1"><span>12px</span><span>32px</span></div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Position</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['above', 'below'] as const).map(pos => (
                                                    <button key={pos} onClick={() => setLabelPosition(pos)} className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all flex items-center justify-center gap-1.5 ${labelPosition === pos ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}>
                                                        {pos === 'above' ? '↑' : '↓'} {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                                <IconPhoto size={16} className="text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">Logo</span>
                            </div>
                            <CardContent className="p-5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Center logo</Label>
                                {logoPreview ? (
                                    <div className="flex items-center gap-3">
                                        <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{logoFile?.name}</p>
                                            <p className="text-[11px] text-muted-foreground">{logoFile ? (logoFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={removeLogo} className="text-red-500 hover:text-red-600 shrink-0"><IconTrash size={16} /></Button>
                                    </div>
                                ) : (
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full h-[68px] border-2 border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                        <IconPhoto size={20} /><span className="text-xs font-medium">Upload logo</span>
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Size */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconResize size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Size</span>
                        </div>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Code Size</Label>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{qrSize}px</span>
                            </div>
                            <input type="range" min={160} max={420} step={10} value={qrSize} onChange={e => setQrSize(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-gradient-to-r from-primary/20 to-primary/60 cursor-pointer accent-primary" />
                            <div className="flex justify-between text-[11px] text-muted-foreground mt-1"><span>160px</span><span>420px</span></div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT: Preview & Actions (2 cols) ───────────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Preview */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconQrcode size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Preview</span>
                        </div>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-6" style={{ backgroundColor: bgColor === '#FFFFFF' ? undefined : bgColor + '15' }}>
                                <div ref={exportRef} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: bgColor, borderRadius: '16px' }}>
                                    {label && labelPosition === 'above' && (
                                        <p style={{ marginBottom: '14px', fontSize: `${labelFontSize}px`, fontWeight: 600, color: fgColor, textAlign: 'center', maxWidth: qrSize, wordBreak: 'break-word', fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            {label}
                                        </p>
                                    )}
                                    <div ref={qrRef} />
                                    {label && labelPosition === 'below' && (
                                        <p style={{ marginTop: '14px', fontSize: `${labelFontSize}px`, fontWeight: 600, color: fgColor, textAlign: 'center', maxWidth: qrSize, wordBreak: 'break-word', fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            {label}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Encoded Value</p>
                                <p className="text-sm text-foreground font-mono break-all line-clamp-2">{qrValue || '(empty)'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Download */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconDownload size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Download</span>
                        </div>
                        <CardContent className="p-5 space-y-3">
                            <Button onClick={downloadPNG} disabled={exportingPNG || exportingPDF || !qrValue.trim()} className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 gap-2.5">
                                {exportingPNG ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconDownload size={18} />}
                                {exportingPNG ? 'Exporting...' : 'Download PNG'}
                                {!exportingPNG && <span className="text-xs opacity-70 font-normal ml-auto">High Res</span>}
                            </Button>
                            <Button onClick={downloadPDF} disabled={exportingPNG || exportingPDF || !qrValue.trim()} variant="outline" className="w-full h-12 font-semibold rounded-xl border-2 gap-2.5">
                                {exportingPDF ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <IconFileTypePdf size={18} className="text-red-500" />}
                                {exportingPDF ? 'Exporting...' : 'Download PDF'}
                                {!exportingPDF && <span className="text-xs opacity-50 font-normal ml-auto">A4</span>}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Save */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2.5">
                            <IconDeviceFloppy size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">Save & Track</span>
                        </div>
                        <CardContent className="p-5 space-y-3">
                            <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="QR Code name..." className="h-10 text-sm" />
                            <Button onClick={saveQRCode} disabled={savingQR || !saveName.trim() || !qrValue.trim()} className="w-full h-10 gap-2">
                                {savingQR ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconDeviceFloppy size={16} />}
                                {savingQR ? 'Saving...' : (id ? 'Update QR Code' : 'Save QR Code')}
                            </Button>
                            <p className="text-[11px] text-muted-foreground text-center">Save to get a trackable short URL with scan statistics</p>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><IconSparkles size={14} className="text-primary" /> Tips</h4>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                            <li className="flex items-start gap-1.5"><span className="text-primary mt-[2px]">•</span>Error correction switches to H when a logo is added</li>
                            <li className="flex items-start gap-1.5"><span className="text-primary mt-[2px]">•</span>Keep high contrast between foreground and background</li>
                            <li className="flex items-start gap-1.5"><span className="text-primary mt-[2px]">•</span>Shorter URLs = simpler, easier-to-scan QR codes</li>
                            <li className="flex items-start gap-1.5"><span className="text-primary mt-[2px]">•</span>Save your QR to get scan analytics</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
