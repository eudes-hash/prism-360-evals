# Prism 360° - Application Architecture

## Overview

**Prism 360°** is a specialized web application designed for inspecting and evaluating 360° media (images and videos) in equirectangular format. It provides tools for technical analysis, including customizable grid overlays, sector visualization, and issue logging.

## Purpose

The application serves as a quality assurance and inspection tool for 360° content. It allows users to:
- **Visualize** equirectangular media in both 3D spherical and 2D flat projections.
- **Analyze** spatial relationships using dynamic grid overlays.
- **Identify** and log defects or points of interest with precise camera coordinates.
- **Verify** stitching and alignment across different sectors (Front, Right, Back, Left, Top, Bottom).

## Tech Stack

- **Framework:** [React](https://react.dev/) (v19)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **3D Engine:** [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)
- **3D Helpers:** [@react-three/drei](https://github.com/pmndrs/drei)

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── EquirectangularGrid.tsx  # Canvas-based 2D grid overlay generator
│   └── Viewer.tsx               # Main Three.js scene and camera controller
├── App.tsx                      # Main application state and UI layout
├── main.tsx                     # Entry point
└── assets/                      # Static assets
public/
└── 360_images/                  # Sample 360° media files
```

### Core Components

#### 1. `App.tsx`
The root component acting as the controller. It manages:
- **Global State:** Media source, view mode, grid configuration, and logged issues.
- **UI Layer:** The sidebar menu, file upload/selection, and overlay controls.
- **Data Flow:** Passes configuration props down to the `Viewer` component.

#### 2. `Viewer.tsx`
The 3D rendering context. It handles:
- **Scene Setup:** Initializes the Three.js `Canvas`.
- **Media Loading:** Loads images and videos as textures (`THREE.TextureLoader`, `THREE.VideoTexture`).
- **Camera Management:** Switches between:
    - `PerspectiveCamera` for Spherical and Rectilinear views.
    - `OrthographicCamera` for the flat Equirectangular view.
- **Controls:** Uses `OrbitControls` for user interaction in spherical mode.
- **Projections:** Maps the texture onto a `Sphere` (spherical view) or a `Plane` (equirectangular view).

#### 3. `EquirectangularGrid.tsx`
A complex visualization component that generates a dynamic grid texture.
- **Technique:** Uses the HTML5 Canvas API to draw lines and shapes programmatically.
- **Features:**
    - Draws sinusoidal grid lines to represent spherical distortion on a flat plane.
    - Calculates curved boundaries for Top and Bottom polar sectors.
    - Renders dynamic text labels for longitude/latitude.
- **Output:** Creates a `THREE.CanvasTexture` applied to a plane overlaying the main image.

### Key Features Implementation

- **View Modes:**
    - **Spherical:** Standard 360° viewer inside a sphere.
    - **Equirectangular:** Flat projection of the texture.
    - **Rectilinear:** Fixed perspective views (Front, Back, Left, Right) to simulate standard camera angles.
- **Issue Logging:**
    - Captures the current camera state (Position, Target, FOV) when an issue is logged.
    - Allows restoring the exact view state by clicking on a logged issue.
    - Exports issues to a JSON file.

## Deployment

The application is a static Single Page Application (SPA).

### Build Process

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Build for Production:**
    ```bash
    npm run build
    ```
    This compiles TypeScript and bundles assets into the `dist/` directory.

### Serving

The contents of the `dist/` folder can be served by any static file server:
- **Local Preview:** `npm run preview`
- **Static Hosts:** Vercel, Netlify, AWS S3 + CloudFront, GitHub Pages, etc.
- **Docker/Nginx:** Copy `dist/` to the web root of an Nginx container.

### Requirements

- **Node.js:** v18+ (Development)
- **Browser:** Modern browser with WebGL support.

## Development

To start the development server:

```bash
npm run dev
```

This starts Vite in development mode, usually at `http://localhost:5173`.
