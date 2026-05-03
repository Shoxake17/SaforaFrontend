// src/pages/qrcodes/QrCodes.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  DoorOpen,
  Download,
  Link as LinkIcon,
  Check,
  Sliders,
  Plus,
} from 'lucide-react';
import QRCode from 'qrcode';

import { fetchRooms } from '@services/rooms';
import { getRoleConfig } from '@config/roles';
import type { Room } from '@apptypes/room';
import useAuthGuard from '@hooks/useAuthGuard';

import PortalLayout from '@components/PortalLayout';
import EmptyStateCard from '@components/EmptyStateCard';

import './QrCodes.css';

interface RoomQR {
  room: Room;
  url: string;
  dataUrl: string;
}

const QrCodes: React.FC = () => {
  const { slug, roleKey, role, isAuthenticated } = useAuthGuard();
  const config = getRoleConfig(role);

  const [loading, setLoading] = useState(true);
  const [roomQRs, setRoomQRs] = useState<RoomQR[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const buildGuestUrl = (roomNumber: string): string => {
    const origin = window.location.origin;
    return `${origin}/g/${slug}/${roomNumber}`;
  };

  useEffect(() => {
    if (!isAuthenticated || !slug) return;

    const loadAndGenerate = async () => {
      setLoading(true);
      const result = await fetchRooms(slug);

      if (result.success && result.rooms.length > 0) {
        const sorted = [...result.rooms].sort((a, b) => {
          const floorDiff = (a.floor || 0) - (b.floor || 0);
          if (floorDiff !== 0) return floorDiff;
          return a.number.localeCompare(b.number, undefined, { numeric: true });
        });

        const generated: RoomQR[] = await Promise.all(
          sorted.map(async (room) => {
            const url = buildGuestUrl(room.number);
            const dataUrl = await QRCode.toDataURL(url, {
              width: 400,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' },
              errorCorrectionLevel: 'M',
            });
            return { room, url, dataUrl };
          }),
        );
        setRoomQRs(generated);
      } else {
        setRoomQRs([]);
      }

      setLoading(false);
    };

    loadAndGenerate();
  }, [isAuthenticated, slug]);

  const handleDownload = (qr: RoomQR) => {
    const link = document.createElement('a');
    link.href = qr.dataUrl;
    link.download = `room-${qr.room.number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (qr: RoomQR) => {
    try {
      await navigator.clipboard.writeText(qr.url);
      setCopiedId(qr.room.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = qr.url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(qr.room.id);
        setTimeout(() => setCopiedId(null), 1800);
      } catch (fallbackErr) {
        console.error('Copy failed', fallbackErr);
      }
    }
  };

  return (
    <PortalLayout
      activeNav="qrcodes"
      pageLoading={loading}
      loadingText="Loading QR codes..."
      contentClassName="qr-content"
      rootClassName="qr-root"
      mainClassName="qr-main"
    >
      {/* Topbar */}
      <div className="qr-topbar">
        <div>
          <h1 className="qr-title">
            <QrCode
              size={22}
              strokeWidth={2.2}
              style={{ color: config.badgeColor, marginRight: 10 }}
            />
            Room QR Codes
          </h1>
          <p className="qr-subtitle">
            Scan to access the guest service page for each room
          </p>
        </div>

        <Link
          to={`/portal/${slug}/${roleKey}/settings`}
          className="qr-settings-btn"
        >
          <Sliders size={14} strokeWidth={2.2} />
          Guest Page Settings
        </Link>
      </div>

      {/* Empty state */}
      {roomQRs.length === 0 ? (
        <EmptyStateCard
          headerIcon={QrCode}
          title="No QR Codes Yet"
          message="Add rooms first to generate QR codes"
          accentColor={config.badgeColor}
          action={
            <Link
              to={`/portal/${slug}/${roleKey}/rooms/add`}
              className="qr-empty-btn"
              style={{
                background: `linear-gradient(135deg, ${config.badgeColor}, ${config.badgeColor}dd)`,
              }}
            >
              <Plus size={14} strokeWidth={2.4} />
              Add Room
            </Link>
          }
        />
      ) : (
        <div className="qr-grid" ref={printRef}>
          {roomQRs.map((qr) => (
            <div key={qr.room.id} className="qr-card">
              <div className="qr-img">
                <img src={qr.dataUrl} alt={`Room ${qr.room.number}`} />
              </div>

              <div className="qr-room">
                <DoorOpen
                  size={14}
                  strokeWidth={2.4}
                  style={{ color: config.badgeColor }}
                />
                Room {qr.room.number}
              </div>

              <div className="qr-floor">
                Floor {qr.room.floor || 1}
                {qr.room.room_type && (
                  <> &bull; {(qr.room.room_type as any).name}</>
                )}
              </div>

              <div className="qr-actions">
                <button
                  type="button"
                  className="qr-btn qr-btn-download"
                  onClick={() => handleDownload(qr)}
                  style={{
                    background: `${config.badgeColor}22`,
                    borderColor: `${config.badgeColor}55`,
                    color: config.badgeColor,
                  }}
                >
                  <Download size={12} strokeWidth={2.4} />
                  Download
                </button>

                <button
                  type="button"
                  className="qr-btn qr-btn-copy"
                  onClick={() => handleCopy(qr)}
                >
                  {copiedId === qr.room.id ? (
                    <>
                      <Check size={12} strokeWidth={2.4} color="#16a34a" />
                      <span style={{ color: '#16a34a' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={12} strokeWidth={2.4} />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default QrCodes;