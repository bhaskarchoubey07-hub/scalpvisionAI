import cv2
import numpy as np
import requests
from io import BytesIO

class ImageProcessor:
    def __init__(self):
        pass

    def load_image(self, image_url: str):
        """Loads image from URL and returns as OpenCV BGR image."""
        try:
            response = requests.get(image_url)
            response.raise_for_status()
            image_bytes = BytesIO(response.content)
            image_arr = np.frombuffer(image_bytes.read(), np.uint8)
            img = cv2.imdecode(image_arr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Error loading image: {e}")
            return None

    def analyze_chart(self, img):
        """Processes chart image to detect trend, support, and resistance."""
        if img is None:
            return None

        # 1. Grayscale and Blur
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 2. Edge Detection
        edges = cv2.Canny(blurred, 50, 150)

        # 3. Detect Trend Direction (Basic Linear Fit to Edge Points)
        points = np.column_stack(np.where(edges > 0))
        if len(points) > 100:
            # Simple regression on edge points to find general slope
            # Note: This is an approximation. In a real chart, price moves left to right.
            # We sort by x-coordinate and fit a line.
            sorted_points = points[points[:, 1].argsort()]
            x = sorted_points[:, 1]
            y = sorted_points[:, 0]
            # Reverse y because image coordinates are 0-top
            y = img.shape[0] - y
            
            slope, _ = np.polyfit(x, y, 1)
            if slope > 0.1:
                trend = "uptrend"
            elif slope < -0.1:
                trend = "downtrend"
            else:
                trend = "sideways"
        else:
            trend = "sideways"

        # 4. Support and Resistance (Horizontal Projection)
        # We look for clusters of horizontal edges
        rows_sum = np.sum(edges, axis=1)
        # Find peaks in the horizontal projection
        peaks = []
        threshold = np.mean(rows_sum) + np.std(rows_sum)
        for i in range(1, len(rows_sum) - 1):
            if rows_sum[i] > threshold and rows_sum[i] > rows_sum[i-1] and rows_sum[i] > rows_sum[i+1]:
                peaks.append(i)

        # Map pixel peaks to "levels" (approximate 0-100 scale or relative)
        # Since we don't have price data yet, we'll return pixel levels for now
        # to be converted by the strategy engine.
        h, _ = img.shape
        support_levels = [round((h - p) / h * 100, 2) for p in peaks if (h - p) / h < 0.5]
        resistance_levels = [round((h - p) / h * 100, 2) for p in peaks if (h - p) / h >= 0.5]

        return {
            "trend": trend,
            "support_levels": sorted(list(set(support_levels))),
            "resistance_levels": sorted(list(set(resistance_levels))),
            "image_height": h
        }

image_processor = ImageProcessor()
