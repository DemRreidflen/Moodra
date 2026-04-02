export function BookLoader() {
  return (
    <>
      <style>{`
        @keyframes ml-page-turn {
          0%   { transform: rotateY(0deg) scaleX(1);   opacity: 1; }
          40%  { transform: rotateY(-80deg) scaleX(0); opacity: 0.3; }
          60%  { transform: rotateY(-80deg) scaleX(0); opacity: 0.3; }
          100% { transform: rotateY(-160deg) scaleX(1); opacity: 1; }
        }
        @keyframes ml-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes ml-fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ml-pulse-text {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.7; }
        }
        .ml-wrap {
          animation: ml-float 3s ease-in-out infinite, ml-fade-in 0.6s ease-out both;
        }
        .ml-page {
          animation: ml-page-turn 1.6s cubic-bezier(0.45,0,0.55,1) infinite;
          transform-style: preserve-3d;
          transform-origin: left center;
        }
        .ml-hint {
          animation: ml-pulse-text 2.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center gap-8"
        style={{ background: "hsl(30, 58%, 97%)" }}
      >
        <div className="ml-wrap" style={{ perspective: "600px" }}>
          <div style={{ position: "relative", width: 90, height: 68 }}>

            {/* Soft shadow below */}
            <div style={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 70,
              height: 8,
              borderRadius: "50%",
              background: "rgba(249,109,28,0.12)",
              filter: "blur(5px)",
            }} />

            {/* Left page */}
            <div style={{
              position: "absolute",
              left: 0, top: 0,
              width: 40, height: 60,
              background: "#fff",
              borderRadius: "3px 0 0 3px",
              border: "1px solid rgba(249,109,28,0.16)",
              borderRight: "none",
              boxShadow: "inset -1px 0 0 rgba(249,109,28,0.08)",
            }}>
              {[10, 19, 28, 37, 46].map(y => (
                <div key={y} style={{
                  position: "absolute",
                  left: 7, right: 7, top: y,
                  height: 1,
                  borderRadius: 2,
                  background: `rgba(249,109,28,${y < 20 ? "0.18" : "0.1"})`,
                }} />
              ))}
            </div>

            {/* Spine */}
            <div style={{
              position: "absolute",
              left: 40, top: 0,
              width: 10, height: 60,
              background: "linear-gradient(180deg, #F96D1C 0%, #FF9640 100%)",
              borderRadius: 1,
              zIndex: 10,
              boxShadow: "0 0 8px rgba(249,109,28,0.3)",
            }} />

            {/* Right page (static) */}
            <div style={{
              position: "absolute",
              right: 0, top: 0,
              width: 40, height: 60,
              background: "#FEF8F4",
              borderRadius: "0 3px 3px 0",
              border: "1px solid rgba(249,109,28,0.12)",
              borderLeft: "none",
            }}>
              {[10, 19, 28].map(y => (
                <div key={y} style={{
                  position: "absolute",
                  left: 7, right: 7, top: y,
                  height: 1,
                  borderRadius: 2,
                  background: "rgba(249,109,28,0.08)",
                }} />
              ))}
            </div>

            {/* Flipping page */}
            <div
              className="ml-page"
              style={{
                position: "absolute",
                left: 50, top: 0,
                width: 40, height: 60,
                background: "linear-gradient(135deg, #FFE8D6 0%, #FFD5B8 100%)",
                borderRadius: "0 3px 3px 0",
                border: "1px solid rgba(249,109,28,0.1)",
                borderLeft: "none",
                zIndex: 5,
              }}
            >
              {[10, 22, 34].map(y => (
                <div key={y} style={{
                  position: "absolute",
                  left: 7, right: 7, top: y,
                  height: 1,
                  borderRadius: 2,
                  background: "rgba(249,109,28,0.2)",
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <img
            src="/moodra-logo-full.png"
            alt="moodra"
            style={{ height: 22, width: "auto", objectFit: "contain", opacity: 0.4 }}
          />
          <div className="ml-hint" style={{ fontSize: 11, letterSpacing: "0.12em", color: "#c2a897", textTransform: "uppercase" }}>
            loading
          </div>
        </div>
      </div>
    </>
  );
}
