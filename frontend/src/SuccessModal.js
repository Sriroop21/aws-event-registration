import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Download, Mail, X } from 'lucide-react';
import './SuccessModal.css';

function SuccessModal({ registrationData, onClose }) {
  const downloadQRCode = () => {
    try {
      const svg = document.getElementById('qr-code-svg');
      if (!svg) {
        console.error('QR code SVG not found');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `ticket-${registrationData.registrationId.substring(0, 8)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.onerror = (error) => {
        console.error('Error loading QR code image:', error);
        alert('Failed to download QR code. Please try again.');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  if (!registrationData) {
    return null;
  }

  return (
    <div className="success-modal-overlay">
      <div className="success-modal-container">
        {/* Header */}
        <div className="success-modal-header">
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close"
          >
            <X className="icon" />
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Award className="icon" />
            </div>
            <div>
              <h2 className="header-title">Registration Successful! 🎉</h2>
              <p className="header-subtitle">Your ticket has been generated</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          {/* Event Details */}
          <div className="event-details-card">
            <h3 className="card-title">📅 Event Details</h3>
            <div className="details-list">
              <div className="detail-item">
                <span className="detail-label">Event:</span>
                <span className="detail-value">{registrationData.eventName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{registrationData.eventDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{registrationData.eventTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{registrationData.eventLocation}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Registration ID:</span>
                <span className="detail-value registration-id">
                  {registrationData.registrationId.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-code-card">
            <h3 className="card-title">🎫 Your Digital Ticket</h3>
            <div className="qr-code-wrapper">
              <div className="qr-code-container">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={registrationData.qrCode}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <p className="qr-description">Scan this QR code at the event entrance</p>
            <p className="qr-id">
              ID: {registrationData.registrationId.substring(0, 8)}
            </p>
          </div>

          {/* Email Reminder */}
          <div className="email-reminder">
            <Mail className="reminder-icon" />
            <div>
              <p className="reminder-title">Check your email!</p>
              <p className="reminder-text">
                We've sent a confirmation email with your ticket details and QR code.
                Please check your spam folder if you don't see it in your inbox.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              onClick={downloadQRCode}
              className="action-button primary"
            >
              <Download className="icon" />
              Download QR Code
            </button>
            <button
              onClick={onClose}
              className="action-button secondary"
            >
              Close
            </button>
          </div>

          {/* Important Notes */}
          <div className="important-notes">
            <p className="notes-title">Important:</p>
            <ul className="notes-list">
              <li>Arrive 15 minutes before the event starts</li>
              <li>Bring a valid ID for verification</li>
              <li>Save or print this QR code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessModal;