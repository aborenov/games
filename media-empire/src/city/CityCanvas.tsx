import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CityEngine } from "./engine";
import type { CityCanvasProps, CityHandle, CityPlaceId } from "./types";
import "./city.css";

export const CityCanvas = forwardRef<CityHandle, CityCanvasProps>(
  function CityCanvas(
    { view, selected, markers, onSelect, onReady, onError },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null),
      engineRef = useRef<CityEngine | null>(null),
      buttons = useRef(new Map<CityPlaceId, HTMLButtonElement>());
    const latest = useRef({ view, onSelect, onReady, onError });
    latest.current = { view, onSelect, onReady, onError };
    const [error, setError] = useState<string | null>(null);
    useImperativeHandle(
      ref,
      () => ({
        focus: (id) => engineRef.current?.focus(id),
        reset: () => engineRef.current?.reset(),
        zoomBy: (factor) => engineRef.current?.zoomBy(factor),
        rotate: () => engineRef.current?.rotate(),
      }),
      [],
    );
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;
      try {
        const engine = new CityEngine(host, {
          view: latest.current.view,
          onSelect: (id) => latest.current.onSelect(id),
          onReady: () => latest.current.onReady?.(),
          onError: (message) => {
            setError(message);
            latest.current.onError?.(message);
          },
        });
        engineRef.current = engine;
        engine.setMarkers(
          [...buttons.current].map(([id, element]) => ({ id, element })),
        );
        engine.select(selected);
        return () => {
          engine.dispose();
          engineRef.current = null;
        };
      } catch (cause) {
        const message =
          "Не удалось открыть 3D-город. Проверьте, включено ли аппаратное ускорение браузера. Игра и список городских мест остаются доступны.";
        console.error("City renderer:", cause);
        setError(message);
        latest.current.onError?.(message);
      }
      // The scene is owned by the host. Simulation updates do not recreate WebGL.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
      engineRef.current?.updateView(view);
    }, [view]);
    useEffect(() => {
      engineRef.current?.select(selected);
    }, [selected]);
    useEffect(() => {
      engineRef.current?.setMarkers(
        [...buttons.current].map(([id, element]) => ({ id, element })),
        markers,
      );
    }, [markers]);
    return (
      <div
        ref={hostRef}
        className="city-viewport"
        data-testid="city-canvas"
        aria-label="Город Белфорд"
      >
        <div className="city-marker-layer" aria-label="События в городе">
          {markers.map((marker) => (
            <button
              key={marker.id}
              ref={(element) => {
                if (element) buttons.current.set(marker.id, element);
                else buttons.current.delete(marker.id);
              }}
              className={`city-marker city-marker--${marker.tone}${selected === marker.id ? " is-selected" : ""}`}
              data-place={marker.id}
              type="button"
              onClick={(event) => {
                if (event.detail === 0) onSelect(marker.id);
              }}
              aria-label={marker.label}
              title={marker.label}
            >
              <span className="city-marker-icon" aria-hidden="true">
                {marker.tone === "urgent"
                  ? "!"
                  : marker.tone === "money"
                    ? "$"
                    : marker.tone === "selected"
                      ? "●"
                      : "+"}
              </span>
              <span className="city-marker-label">{marker.label}</span>
            </button>
          ))}
        </div>
        {error && (
          <div className="city-error" role="alert">
            <strong>Город временно недоступен</strong>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Восстановить город
            </button>
          </div>
        )}
      </div>
    );
  },
);
