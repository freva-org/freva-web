import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

// Backend status codes:
// 0: finished ok  1: failed  2: not found  3: waiting  4: processing  5: gone

const STAGES = [
  { id: "submitted", label: "Submitted" },
  { id: "queued", label: "Queued" },
  { id: "converting", label: "Converting" },
  { id: "ready", label: "Ready" },
];

function statusToStageIndex(statusCode) {
  if (statusCode === 0) {
    return 3;
  }
  if (statusCode === 4) {
    return 2;
  }
  return 1;
}

const PROCESSING_MESSAGES = [
  "Reading file structure…",
  "Analysing coordinate metadata…",
  "Optimising chunk layout…",
  "Building Zarr metadata store…",
  "Assembling data variables…",
  "Applying access-pattern optimisation…",
  "Finalising dataset…",
];

const AGGREGATION_MESSAGES = [
  "Aligning coordinate indexes…",
  "Resolving variable conflicts…",
  "Concatenating along dimension…",
  "Merging datasets…",
  "Validating compatibility…",
  "Assembling aggregated store…",
  "Almost there…",
];

const KEYFRAMES = `
  @keyframes zarrPulseRing {
    0%   { transform: scale(0.9); opacity: 0.7; }
    60%  { transform: scale(1.6); opacity: 0;   }
    100% { transform: scale(0.9); opacity: 0;   }
  }
  @keyframes zarrSpinArc {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes zarrMsgIn {
    0%   { opacity: 0; transform: translateY(5px);  }
    18%  { opacity: 1; transform: translateY(0);     }
    82%  { opacity: 1; transform: translateY(0);     }
    100% { opacity: 0; transform: translateY(-5px);  }
  }
  @keyframes zarrTrackFill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .zarr-spin { animation: zarrSpinArc 1.3s linear infinite; transform-origin: center; }
  .zarr-msg  { animation: zarrMsgIn 2.8s ease-in-out forwards; }
`;

const C = {
  done: "#0d9488",
  active: "#14b8a6",
  pending: "#d1d5db",
  track: "#e5e7eb",
  textOn: "#0f766e",
  textOff: "#9ca3af",
  msg: "#6b7280",
  timer: "#d1d5db",
};

export function ZarrLoadingSteps({ statusCode = 3, isAggregation = false }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgKey, setMsgKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const stageIdx = statusToStageIndex(statusCode);
  const messages = isAggregation ? AGGREGATION_MESSAGES : PROCESSING_MESSAGES;

  useEffect(() => {
    if (stageIdx !== 2) {
      return () => {};
    }
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
      setMsgKey((k) => k + 1);
    }, 2800);
    return () => clearInterval(id);
  }, [stageIdx, messages.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatElapsed = (s) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          padding: "28px 12px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: "360px",
            marginBottom: "28px",
          }}
        >
          {STAGES.map((stage, i) => {
            const isDone = i < stageIdx;
            const isActive = i === stageIdx;

            return (
              <React.Fragment key={stage.id}>
                {i > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      background: isDone
                        ? `linear-gradient(90deg, ${C.done}, ${C.active})`
                        : C.track,
                      transition: "background 0.5s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          background: `linear-gradient(90deg, ${C.done}, ${C.active})`,
                          animation: "zarrTrackFill 0.6s ease forwards",
                        }}
                      />
                    )}
                  </div>
                )}

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        border: `2px solid ${C.active}`,
                        animation: "zarrPulseRing 2s ease-out infinite",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: isDone
                        ? C.done
                        : isActive
                          ? "#fff"
                          : "#f9fafb",
                      border: `2px solid ${isDone ? C.done : isActive ? C.active : C.pending}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                      boxShadow: isActive
                        ? `0 0 0 4px rgba(20,184,166,0.12)`
                        : "none",
                      transition: "all 0.4s ease",
                    }}
                  >
                    {isDone ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.8 7L9 1"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : isActive ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        className="zarr-spin"
                        style={{ position: "absolute" }}
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="5.5"
                          fill="none"
                          stroke={C.active}
                          strokeWidth="2"
                          strokeDasharray="18 17"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: C.pending,
                        }}
                      />
                    )}
                  </div>

                  <span
                    style={{
                      position: "absolute",
                      top: "28px",
                      fontSize: "10.5px",
                      fontWeight: isActive ? 600 : 400,
                      color: isDone ? C.done : isActive ? C.textOn : C.textOff,
                      whiteSpace: "nowrap",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      transition: "color 0.4s ease",
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ height: "20px" }} />

        <div style={{ minHeight: "22px", textAlign: "center" }}>
          {stageIdx === 2 && (
            <span
              key={msgKey}
              className="zarr-msg"
              style={{ fontSize: "13px", color: C.msg }}
            >
              {messages[msgIdx]}
            </span>
          )}
          {stageIdx === 1 && (
            <span style={{ fontSize: "13px", color: C.msg }}>
              Waiting for a worker to pick up the task…
            </span>
          )}
        </div>

        <div style={{ marginTop: "10px" }}>
          <span
            style={{
              fontSize: "11px",
              color: C.timer,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.05em",
            }}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
    </>
  );
}

ZarrLoadingSteps.propTypes = {
  statusCode: PropTypes.number,
  isAggregation: PropTypes.bool,
};

export default ZarrLoadingSteps;
