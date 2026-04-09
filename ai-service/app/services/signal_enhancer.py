import math
from typing import List, Optional, Dict, Tuple

class SignalEnhancer:
    def __init__(self):
        # Weighted factors for confidence calculation
        self.weights = {
            "volume_support": 15,
            "trend_alignment": 25,
            "breakout_quality": 20,
            "volatility_check": 15,
            "rr_ratio": 25
        }

    def enhance(self, signal: Dict, metadata: Dict) -> Dict:
        """
        Main entry point for signal enhancement.
        signal: {direction, entry_price, stop_loss, take_profit, confidence, timeframe, support, resistance}
        metadata: {volume, avg_volume, atr, volatility, current_price, trend}
        """
        direction = signal.get("direction", "neutral")
        if direction == "neutral":
            return {**signal, "validity": True, "refinement_reason": "Neutral signal, no enhancement applied."}

        current_price = metadata.get("current_price") or signal.get("entry_price")
        support_levels = signal.get("support", [])
        resistance_levels = signal.get("resistance", [])
        atr = metadata.get("atr") or (current_price * 0.01) # Fallback 1% ATR

        # 1. Validation Logic
        reasons = []
        validity = True
        
        # Volume Check
        volume_ok, vol_reason = self._validate_volume(metadata)
        reasons.append(vol_reason)

        # Trend Alignment
        trend_ok, trend_reason = self._validate_trend(direction, metadata.get("trend"))
        reasons.append(trend_reason)

        # 2. Fake Breakout Detection
        fake_breakout, breakout_reason = self._detect_fake_breakout(direction, current_price, resistance_levels, support_levels, atr)
        if fake_breakout:
            validity = False
            reasons.append(breakout_reason)

        # 3. Retest Entry Calculation
        refined_entry, entry_zone = self._calculate_retest_zone(direction, current_price, support_levels, resistance_levels, atr)
        
        # 4. SL/TP Optimization
        optimized_sl, optimized_tp = self._optimize_levels(direction, refined_entry, signal.get("stop_loss"), signal.get("take_profit"), support_levels, resistance_levels, atr)
        
        # 5. Enhanced Confidence Scoring
        base_confidence = signal.get("confidence", 50)
        enhancement_score = 0
        if volume_ok: enhancement_score += self.weights["volume_support"]
        if trend_ok: enhancement_score += self.weights["trend_alignment"]
        if not fake_breakout: enhancement_score += self.weights["breakout_quality"]
        
        # RR Check
        risk = abs(refined_entry - optimized_sl)
        reward = abs(optimized_tp - refined_entry)
        rr = reward / risk if risk > 0 else 0
        if rr >= 2.0: enhancement_score += self.weights["rr_ratio"]
        elif rr >= 1.5: enhancement_score += self.weights["rr_ratio"] * 0.6
        
        final_confidence = min(99, round((base_confidence * 0.4) + (enhancement_score * 0.6)))

        return {
            **signal,
            "refined_entry": round(refined_entry, 2),
            "entry_zone": entry_zone,
            "stop_loss": round(optimized_sl, 2),
            "take_profit": round(optimized_tp, 2),
            "confidence": final_confidence,
            "validity": validity,
            "refinement_reason": " | ".join([r for r in reasons if r]),
            "risk_reward": round(rr, 2)
        }

    def _validate_volume(self, metadata: Dict) -> Tuple[bool, str]:
        volume = metadata.get("volume")
        avg_volume = metadata.get("avg_volume")
        if volume is None or avg_volume is None:
            return True, "Volume data unavailable, skipping check."
        
        if volume > avg_volume * 1.2:
            return True, "Strong volume support."
        elif volume < avg_volume * 0.7:
            return False, "Low volume warning."
        return True, "Normal volume conditions."

    def _validate_trend(self, direction: str, trend: str) -> Tuple[bool, str]:
        if not trend or trend == "unknown":
            return True, "Trend context missing."
        
        if (direction == "long" and trend == "uptrend") or (direction == "short" and trend == "downtrend"):
            return True, "Aligned with primary trend."
        elif trend == "sideways":
            return True, "Trading in consolidation range."
        return False, f"Counter-trend trade ({direction} signal in {trend})."

    def _detect_fake_breakout(self, direction: str, price: float, resistance: List[float], support: List[float], atr: float) -> Tuple[bool, str]:
        # Simple heuristic: if price is very close to resistance but momentum is slowing (if we had candles)
        # Without candles, we look at distance to levels.
        if direction == "long":
            for res in resistance:
                # If price just briefly poked above resistance and returned
                if res < price < res + (0.05 * atr):
                    return False, "Consolidating near resistance breakout."
                if price > res + (2.0 * atr):
                    return True, "Overextended breakout (possible pullback)."
        elif direction == "short":
            for sup in support:
                if sup - (0.05 * atr) < price < sup:
                    return False, "Consolidating near support breakdown."
                if price < sup - (2.0 * atr):
                    return True, "Overextended breakdown (possible pullback)."
        
        return False, ""

    def _calculate_retest_zone(self, direction: str, price: float, support: List[float], resistance: List[float], atr: float) -> Tuple[float, str]:
        """Calculates a better entry zone near a retest level."""
        zone_half_width = 0.1 * atr
        
        if direction == "long":
            # Look for the nearest support below current price for a retest entry
            lower_supports = [s for s in support if s <= price]
            retest_level = lower_supports[-1] if lower_supports else price * 0.995
            
            # If current price is already near a support, use that.
            if abs(price - retest_level) < 0.5 * atr:
                entry = price
            else:
                entry = retest_level + (0.2 * atr) # Slightly above for fill
            
        else: # short
            upper_resistances = [r for r in resistance if r >= price]
            retest_level = upper_resistances[0] if upper_resistances else price * 1.005
            
            if abs(price - retest_level) < 0.5 * atr:
                entry = price
            else:
                entry = retest_level - (0.2 * atr)

        zone_start = entry - zone_half_width
        zone_end = entry + zone_half_width
        return entry, f"{zone_start:.2f} - {zone_end:.2f}"

    def _optimize_levels(self, direction: str, entry: float, current_sl: float, current_tp: float, support: List[float], resistance: List[float], atr: float) -> Tuple[float, float]:
        """Tries to find structure-based SL/TP, falls back to ATR multiples."""
        if direction == "long":
            # SL below nearest major support
            lower_supports = [s for s in support if s < entry]
            new_sl = lower_supports[-1] - (0.1 * atr) if lower_supports else entry - (1.5 * atr)
            
            # TP at nearest resistance
            upper_res = [r for r in resistance if r > entry]
            new_tp = upper_res[0] if upper_res else entry + (3.0 * atr)
            
            # Sanity check: ensure positive RR
            if new_tp <= entry: new_tp = entry + (3.0 * atr)
            if new_sl >= entry: new_sl = entry - (1.5 * atr)
            
        else: # short
            upper_res = [r for r in resistance if r > entry]
            new_sl = upper_res[0] + (0.1 * atr) if upper_res else entry + (1.5 * atr)
            
            lower_supports = [s for s in support if s < entry]
            new_tp = lower_supports[-1] if lower_supports else entry - (3.0 * atr)
            
            if new_tp >= entry: new_tp = entry - (3.0 * atr)
            if new_sl <= entry: new_sl = entry + (1.5 * atr)
            
        return new_sl, new_tp

signal_enhancer = SignalEnhancer()
