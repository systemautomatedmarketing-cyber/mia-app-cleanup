// client/src/hooks/use-tour.ts
// Gestisce lo stato del product tour e la persistenza su Firestore

import { useState, useEffect, useCallback } from "react";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export type TourSection = "dashboard" | "credits" | "profile";

export interface TourState {
  completedSections: TourSection[];
  completedAt?: string;
  version: number; // incrementa per forzare rivedere tour dopo aggiornamenti major
}

const TOUR_VERSION = 1;

// Legge lo stato tour da Firestore
async function fetchTourState(uid: string): Promise<TourState | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data()?.tourState ?? null;
  } catch {
    return null;
  }
}

// Scrive lo stato tour su Firestore
async function saveTourState(uid: string, state: TourState): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), {
      tourState: state,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // silenzioso — il tour non deve mai rompere l'app
  }
}

export function useTour(section: TourSection) {
  const qc = useQueryClient();
  const [showTour, setShowTour] = useState(false);
  const [tourState, setTourState] = useState<TourState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }

    fetchTourState(uid).then((state) => {
      setTourState(state);

      const alreadySeen =
        state?.version === TOUR_VERSION &&
        state?.completedSections?.includes(section);

      if (!alreadySeen) {
        // Piccolo delay per non sparare il tour immediatamente sul render
        setTimeout(() => setShowTour(true), 800);
      }
      setIsLoading(false);
    });
  }, [uid, section]);

  // Marca la sezione corrente come vista
  const markSectionDone = useCallback(async () => {
    if (!uid) return;
    setShowTour(false);

    const prev = tourState ?? { completedSections: [], version: TOUR_VERSION };
    const next: TourState = {
      version: TOUR_VERSION,
      completedAt: new Date().toISOString(),
      completedSections: Array.from(
        new Set([...prev.completedSections, section])
      ),
    };
    setTourState(next);
    await saveTourState(uid, next);
    qc.invalidateQueries({ queryKey: [api.auth.user.path] });
  }, [uid, section, tourState, qc]);

  // Rivedi il tour (resetta solo la sezione corrente)
  const restartTour = useCallback(async () => {
    if (!uid) return;

    const prev = tourState ?? { completedSections: [], version: TOUR_VERSION };
    const next: TourState = {
      ...prev,
      completedSections: prev.completedSections.filter((s) => s !== section),
    };
    setTourState(next);
    await saveTourState(uid, next);
    setTimeout(() => setShowTour(true), 300);
  }, [uid, section, tourState]);

  return { showTour, isLoading, markSectionDone, restartTour };
}
