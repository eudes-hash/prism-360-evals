Advanced Data Annotation for 360° Equirectangular Videos Generation

Introduction
Limitations in 360° Generative Videos
Based on an empirical analysis of annotation tasks from the 907b0052-4094-4400-bb42-431420cfdf5e batch of 360° video outputs, we observe recurring geometric inconsistencies in the given videos. Despite targeting equirectangular generation, the outputs exhibit distortions, such as seam misalignment, curvature errors, incomplete spatial closure, and polar inaccuracies, that compromise spatial coherence and limit their reliability for applications requiring precise spherical representations.
Strategic Goal: Accurate Data for Quality Evaluation
The primary objective of this proposal is to generate high-precision ground-truth data for 360° generated imagery. By establishing structured annotation protocols, we provide a robust framework for detailed quality evaluation (QA) that moves beyond cut in spatial continuity. This allows annotators to evaluate four critical dimensions: Seam Integrity, Geodetic Curvature, Spatial Closure, and Polar Convergence.
Theoretical Foundations of 360° Imaging
The Equirectangular Foundation
A 360° equirectangular image is a cylindrical equidistant projection. To evaluate it accurately, the 2D plane must be treated as a mathematical map defined by:
Aspect Ratio (2:1): The width () must be exactly twice the height (), representing  of visual coverage.
The Horizontal Loop: The left edge () and the right edge () represent the same line in 360° space. Content must be seamless across this "stitch."
Pole Singularities: The top and bottom edges represent single points in space.
Zenith (Top):  Latitude (The Ceiling).
Nadir (Bottom):  Latitude (The Floor).
The Mathematics: From Plane to Sphere
The projection of a 2D pixel at  to a 360° Cartesian point  follows a three-step transformation:

First Step: Normalize Coordinates

Second Step: Calculate Spherical Angles (Radians)


Third Step: Cartesian Mapping

	
	
Common Failures
Sector Fusion. The model has merged the Front and Right sectors into a single continuous perspective, eliminating the 90° corner. This error prevents the formation of a 4-wall layout. 


Geodetic Curvature Mismatch: Drawing straight lines on the 2D canvas where the projection requires sinusoidal curves. This breaks immersion in 360° viewers.
This sample exhibits a Geodetic Curvature Mismatch. The laptop is depicted as a straight line in the 2D plane despite being at a high latitude. In a valid 360° format, objects outside the horizon line must be curved in 2D to appear rectilinear in 360°. 

Here you see the image rendered in 360, with an unwanted curvature.

Pole Distortion: Failure to apply radial stretching, causing the floor (Nadir) to look like a "black hole" and the ceiling (Zenith) to "pinch" objects.



Technical Proposal
To generate the high-fidelity "ground truth" geometry required for Reinforcement Learning from Human Feedback (RLHF), we utilize the Prism 360 Platform. This tool enables the precise visualization of equirectangular images across six logical sectors, each representing a specific spherical vector. By isolating these sectors, annotators can identify geodetic anomalies, such as radial distortion, perspective warping, and structural collapses, that are otherwise invisible in a 2D plane.

Data Annotation Framework: Quality Metrics
Data annotation will focus on four key sectors: Front, Right, Left, Back, Bottom, and Top. Within these sectors, five metrics will be evaluated. The sectors are defined as follows:
Sector
Description
Front View ()
Location: Horizontal center.
Key Indicator: Lowest geometric distortion. Real-world vertical lines must appear perfectly straight.
Right & Left Views ()
Location: Lateral quadrants.
Key Indicator: Curvature increases significantly. Used to verify horizontal depth consistency and prevent "Missing Wall Syndrome."
Back View      
(- The Stitch)
Location: Split between the far-left and far-right edges.
Key Indicator: Stitching Integrity. The content on the absolute left must align pixel-perfectly with the absolute right to create an infinite loop.
Zenith & Nadir
( Latitude)
Location: Top and bottom horizontal strips.
Key Indicator: High radial distortion. Objects must converge into a single clean point. Failure results in "Pole Collapse" (shattered textures or star-shaped artifacts).


And the five core metrics, where any breach of these standards constitutes a "Hard Fail" in the training dataset, are defined this way:
Seam Integrity (Horizontal Loop)
Definition: This metric evaluates the  junction where the left and right edges of the 2D plane meet in 360° space.
Critical Indicator: A Fail occurs when there is a visible break in spatial continuity at the image stitch within the Back Sector. This is identified when objects crossing the right edge do not reappear with alignment on the left, failing to maintain the infinite horizontal loop required for a valid  environment.
Geodetic Curvature: 
Definition: This is an architectural audit of the projection’s geometry. It verifies that the model correctly understands how 360° space maps to a 2D canvas.
Critical Indicator: A Fail is triggered when real-world horizontal lines are depicted as straight lines in the 2D plane instead of following the required sinusoidal curves for equirectangular projection.
In the following example, you can see how the curvature of the edges of the kitchen cabinet in the 2D plane follows the curvature in the Top sector that goes from the Right to the Back, which, when projected onto a sphere, looks like a completely natural straight line.
Equirectangular format example:

360° Projection

This is a successful generation of a 360° image!
Spatial Realism and Structural Consistency:
Definition: This evaluation focuses on the structural aesthetics of the model, determining whether the generated 360° spaces are realistic and architecturally sound. The objective is to identify failures where the AI prioritizes visual texture over physical logic, resulting in environments that lack spatial sense.
Spatial Closure (Environment Integrity): This assesses whether the model generates a fully enclosed space. A common error is the creation of 2-wall or 3-wall rooms, where the environment feels open or incomplete, breaking the immersive nature required for a 360° format.
This occurs when the model loses the distinction between vision axes, such as mixing the Front sector with the Right or Left sectors. Instead of rendering a defined 90° corner that marks a room's boundary, the LLM blends both sectors into a single, continuous surface.
Nadir & Zenith Convergence: 
Definition: This metric assesses the quality of the polar singularities (the floor and the ceiling). It ensures that all textures converge naturally into a single point.
Critical Indicator: A Fail occurs when the floor (Nadir) or ceiling (Zenith) texture "shatters," swirls into a chaotic pattern, or creates "pole collapse" artifacts.
Semantic Drift: 
Definition: This focuses on object consistency and identity preservation across the six logical sectors.
Critical Indicator: A Fail is identified when an object changes its identity or properties as the view rotates (e.g., a window in the Front view morphing into a bookshelf in the Right view).

Future Training Pipelines: Spatial Awareness and Coordinate-Based Prompting
As the precision of 360° generation improves through the Prism 360 framework, the next frontier for training involves Spatial Reasoning. By using high-fidelity ground truth data where objects are mapped to exact spherical coordinates, we can train models for advanced robotics and XR (Extended Reality) applications.
This enables a shift from descriptive prompting to Navigational Prompting, where the AI understands the exact angular displacement required to interact with an object.
Core Use Cases
Robotics: Autonomous agents calculating rotation angles for pathfinding or object manipulation.
XR/Wearables: Augmented Reality overlays that maintain world-locked positions based on user head rotation ().
Smart Surveillance: Automated camera systems tracking targets across polar singularities without losing the coordinate lock.
Examples: Coordinate-Aware Prompts and Expected Outputs
In these examples, the model must demonstrate it knows the difference between the 2D pixel position and the 360° spherical coordinate.
Example 1: Robotic Search and Rotation
User Prompt: "Identify the power outlet in the room and provide the rotation angle required to face it directly from the current Front View ()."
AI Response: "Object 'Power Outlet' detected in the Right Sector. To align, a clockwise rotation of  on the Yaw axis is required. Current Nadir-relative elevation is ."
Example 2: XR Object Placement
User Prompt: "In this equirectangular generation, at what coordinates is the ceiling lamp located, and what is its angular width?"
AI Response: "The ceiling lamp is centered at the Zenith (). Its radial footprint extends from , showing symmetric polar convergence without pinching artifacts."
Example 3: Spatial Consistency Check (Multi-Object)
User Prompt: "There is a window in the Front View and a door in the Back View. What is the angular distance between them across the Left Sector?"
AI Response: "The window is at , and the door is at . Moving through the Left Sector, the angular distance is  total, with the midpoint of the Left Sector located at  relative to the window."



