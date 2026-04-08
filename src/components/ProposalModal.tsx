import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      title: "Executive Summary",
      content: `Advanced Data Annotation for 360° Equirectangular Videos Generation

This proposal addresses geometric inconsistencies in 360° generative video outputs through structured annotation protocols. The Prism 360 Platform enables precise quality evaluation across six logical sectors with five critical metrics.`
    },
    {
      title: "Theoretical Foundations",
      content: `The Equirectangular Foundation

A 360° equirectangular image is a cylindrical equidistant projection with a 2:1 aspect ratio. The mathematical transformation from 2D pixel coordinates to spherical coordinates follows a three-step process:

1. Normalize coordinates
2. Calculate spherical angles (radians)
3. Cartesian mapping to 3D sphere

Key concepts include the horizontal loop (left and right edges are the same line), and pole singularities at zenith (top) and nadir (bottom).`
    },
    {
      title: "Common Failures",
      content: `Critical geometric failures observed:

• Sector Fusion: Model merges Front and Right sectors, eliminating 90° corners
• Geodetic Curvature Mismatch: Straight lines drawn where sinusoidal curves are required
• Pole Distortion: Floor (Nadir) appears as "black hole", ceiling (Zenith) pinches objects
• Semantic Drift: Objects change identity across sectors

These failures compromise spatial coherence and limit reliability for RLHF training.`
    },
    {
      title: "Data Annotation Framework",
      content: `Six Logical Sectors:

• Front View (0°): Lowest geometric distortion, vertical lines must be straight
• Right & Left Views (90°/270°): High curvature, verify horizontal depth
• Back View (-180°/180°): The Stitch - must align pixel-perfectly
• Zenith & Nadir (90°/270° latitude): High radial distortion, textures must converge to single point

Five Core Metrics (Hard Fail criteria):
1. Seam Integrity (Horizontal Loop)
2. Geodetic Curvature
3. Spatial Closure (Environment Integrity)
4. Nadir & Zenith Convergence
5. Semantic Drift (Object Consistency)`
    },
    {
      title: "Future Training Pipelines",
      content: `Spatial Awareness and Coordinate-Based Prompting

High-fidelity ground truth enables shift from descriptive to navigational prompting.

Core Use Cases:
• Robotics: Autonomous agents calculating rotation angles
• XR/Wearables: World-locked AR overlays based on head rotation
• Smart Surveillance: Automated tracking across polar singularities

Example Coordinate-Aware Prompt:
"Identify the power outlet in the room and provide the rotation angle required to face it directly from the current Front View (0°)."
Expected AI Response includes exact spherical coordinates and angular displacement.`
    }
  ];

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (isOpen) {
        onClose();
      } else {
        // This will be handled by parent
      }
    }
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const closeModal = onClose;
  const nextSection = () => setCurrentSection((prev) => (prev + 1) % sections.length);
  const prevSection = () => setCurrentSection((prev) => (prev - 1 + sections.length) % sections.length);

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2147483647,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slideLeft { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}
      </style>
      
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 820,
        maxHeight: '92vh',
        margin: '20px',
        boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.6)',
        animation: 'slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 42,
              height: 42,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 700
            }}>
              P
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600 }}>Prism 360° Proposal</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Advanced Data Annotation Framework</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 12,
              color: '#94a3b8',
              fontWeight: 500
            }}>
              {currentSection + 1} / {sections.length}
            </div>
            <button
              onClick={closeModal}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#94a3b8',
                border: 'none',
                width: 36,
                height: 36,
                borderRadius: 999,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '40px 48px',
          overflowY: 'auto',
          color: '#e2e8f0',
          lineHeight: 1.7,
          fontSize: 15
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 8,
              letterSpacing: '-0.02em'
            }}>
              {sections[currentSection].title}
            </div>
            <div style={{ height: 3, width: 48, background: '#3b82f6', borderRadius: 999, marginBottom: 24 }} />
          </div>
          
          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: 15,
            color: '#cbd5e1'
          }}>
            {sections[currentSection].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <button
            onClick={prevSection}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Previous
          </button>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {sections.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSection(idx)}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: currentSection === idx ? '#3b82f6' : 'rgba(148,163,184,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
          
          <button
            onClick={nextSection}
            style={{
              padding: '10px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );

  // No floating button - will be placed in Sidebar instead

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default ProposalModal;
