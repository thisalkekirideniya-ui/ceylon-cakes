import { useEffect, useState, useRef } from 'react';

import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, ChevronLeft, ChevronRight, Quote, Flower2 } from 'lucide-react';

/* ------------------------------------------------------------------
   DESIGN TOKENS — Ceylon Cakes
   Base canvas stays white/ivory throughout (per brief). Warmth and
   character come from an ink-teal (instead of flat black) and a
   muted saffron + claret pairing pulled from spice-box colour, not
   generic "luxury gold". The signature motif is a tier-stack mark
   (••• stacked, narrowing) used as a section device, echoing the
   actual product instead of a numbered-list or sparkle icon.
   ------------------------------------------------------------------
   --ivory:   #FBF8F3   base canvas
   --paper:   #FFFFFF   card / panel canvas
   --ink:     #11302E   "dark" sections — warm ink-teal, not black
   --saffron: #C99A44   muted gold accent, used sparingly
   --claret:  #8C4450   single signature accent colour
   --mute:    #6B6661   body / secondary text on light
-------------------------------------------------------------------*/

// Tier-stack mark — the signature device, used as a divider / badge
function TierMark({ className = "", tone = "ink" }) {
  const fill = tone === "claret" ? "#8C4450" : tone === "saffron" ? "#C99A44" : "#11302E";
  return (
    <svg viewBox="0 0 64 28" className={className} fill="none" aria-hidden="true">
      <rect x="14" y="20" width="36" height="6" rx="1" fill={fill} opacity="0.9" />
      <rect x="20" y="11" width="24" height="6" rx="1" fill={fill} opacity="0.65" />
      <rect x="26" y="2" width="12" height="6" rx="1" fill={fill} opacity="0.4" />
    </svg>
  );
}

// Reusable "drop" entrance — falls from above and settles with a soft
// spring bounce, like a tier being set down on a cake stand.
const dropIn = (delay = 0) => ({
  initial: { opacity: 0, y: -70, scale: 0.92 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-40px" },
  transition: { type: "spring", stiffness: 260, damping: 18, mass: 0.8, delay }
});

// Counter for the metrics band
function Counter({ value, duration = 1.8, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
      return controls.stop;
    }
  }, [inView, count, value, duration]);

  useEffect(() => rounded.on("change", (v) => setDisplayValue(v)), [rounded]);

  return <span ref={ref}>{displayValue}{suffix}</span>;
}

/* --------------------------------------------------------------
   MarqueeRow — a reusable infinite auto-scrolling row.
   direction="left"  -> scrolls toward the left  (content moves right→left)
   direction="right" -> scrolls toward the right (content moves left→right)
   draggable=true adds manual drag with pause-on-interaction / auto-resume.
   Purely passive rows (draggable=false) just glide on their own, no
   pointer handlers needed — lighter weight for ambient background rows.
-------------------------------------------------------------- */
function MarqueeRow({ images, direction = "left", speed = 38, draggable = false, cardClass = "w-40 sm:w-48 aspect-3/4", roundedClass = "rounded-2xl" }) {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isActive, setIsActive] = useState(false); // true while user is interacting (paused)
  const resumeTimer = useRef(null);
  const x = useMotionValue(0);
  const sign = direction === "left" ? -1 : 1;

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setTrackWidth(trackRef.current.scrollWidth / 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [images.length]);

  // Start each row at a different point in its loop so multiple rows
  // never look perfectly synced with each other.
  useEffect(() => {
    if (trackWidth) {
      const offset = direction === "left" ? 0 : -trackWidth;
      x.set(offset);
    }
  }, [trackWidth, direction, x]);

  useEffect(() => {
    if (!trackWidth || isActive) return;
    let frame;
    let last = performance.now();

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = x.get() + sign * speed * dt;
      if (sign < 0 && next <= -trackWidth) next += trackWidth;
      if (sign > 0 && next >= 0) next -= trackWidth;
      x.set(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trackWidth, isActive, x, sign, speed]);

  const pause = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setIsActive(true);
  };
  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsActive(false), 1800);
  };
  const wrapPosition = () => {
    if (!trackWidth) return;
    let val = x.get();
    if (val <= -trackWidth) val += trackWidth;
    if (val > 0) val -= trackWidth;
    x.set(val);
  };

  const dragProps = draggable ? {
    drag: "x",
    dragConstraints: { left: -trackWidth * 2, right: trackWidth },
    dragElastic: 0.08,
    dragTransition: { power: 0.25, timeConstant: 200 },
    onDragStart: pause,
    onDragEnd: () => { wrapPosition(); scheduleResume(); },
    onPointerDown: pause,
    onTouchStart: pause,
  } : {};

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={draggable ? pause : undefined}
      onMouseLeave={draggable ? scheduleResume : undefined}
    >
      <motion.div
        ref={trackRef}
        style={{ x }}
        {...dragProps}
        className={`flex gap-6 w-max select-none ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {[...images, ...images].map((src, index) => (
          <div
            key={index}
            className={`${cardClass} overflow-hidden bg-white shadow-md border border-[#11302E]/8 relative shrink-0 ${roundedClass}`}
          >
            <img
              src={src}
              alt={`Showcase piece ${(index % images.length) + 1}`}
              draggable={false}
              className={`w-full h-full object-cover pointer-events-none grayscale-[0.12] hover:grayscale-0 transition-all duration-500 ${roundedClass}`}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Home({ setCurrentPage }) {
  const [activeReview, setActiveReview] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isCarouselActive, setIsCarouselActive] = useState(false);
  const resumeTimer = useRef(null);
  const autoX = useMotionValue(0);

  const heroSlides = [
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782212549/WhatsApp_Image_2026-06-23_at_16.12.10_ewjucr.jpg",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782212764/WhatsApp_Image_2026-06-23_at_16.33.44_sbhmbq.jpg",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782212776/WhatsApp_Image_2026-06-23_at_16.34.59_uxojr2.jpg",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782212769/WhatsApp_Image_2026-06-23_at_16.35.00_1_f9m05g.jpg",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782212777/WhatsApp_Image_2026-06-23_at_16.34.58_afol1h.jpg"
  ];

  const cakeCollection = [
    "https://images.unsplash.com/photo-1527419220451-f3b990929817?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1519340333755-56e87a38209e?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1464349172961-4c4d3365ad7a?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1534432123161-177b54636d7d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1557925923-33b27f891f88?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1519340333755-56e87a38209e?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1527419220451-f3b990929817?auto=format&fit=crop&q=80&w=400"
  ];

  // Two ambient rows under the main archive — 10 images each, opposite
  // directions, fully automatic (no drag needed, the row above already
  // covers manual browsing).
  const rowFront = [
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1622895326916-660e54e88774?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1562777717-dc6984f65a63?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1607478900766-efe13248b125?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=400"
  ];
  const rowBack = [
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1612203985729-442bd6c2cae0?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1557925923-33b27f891f88?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&q=80&w=400"
  ];

  // Floral bouquet showcase — sugar-flower and bouquet detail shots
  const bouquetCollection = [
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782361315/WhatsApp_Image_2026-06-25_at_09.48.17_g1zjkz.jpg",
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&q=80&w=500",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782361267/WhatsApp_Image_2026-06-25_at_09.48.21_y489up.jpg",
    "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=500",
    "https://res.cloudinary.com/dtscqhcop/image/upload/v1782361266/WhatsApp_Image_2026-06-25_at_09.48.16_bebkiv.jpg",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&q=80&w=500"
  ];

  const testimonials = [
    { text: "Ceylon Cakes transformed our vision into an architectural wonder. The delicate sugar details were pure haute couture.", author: "Lady Seraphina", event: "Wedding Gala at Galle Face" },
    { text: "Beyond beautiful — the flavour profile was rich, balanced, and left our distinguished guests in complete awe.", author: "Aria & Julian", event: "Vow Renewal" },
    { text: "Flawless sophistication. The gold leaf application complemented our aesthetic style seamlessly.", author: "Maximilian Silva", event: "Corporate Soiree" },
    { text: "The floral bouquets were so detailed they looked organically grown. Truly fine art craftsmanship.", author: "Elena Rostova", event: "High-Tea Launch" },
    { text: "Uncompromising luxury from consultation to delivery. The centrepiece of our memorable evening.", author: "Tariq Al-Mansoor", event: "Anniversary Celebration" },
    { text: "The presentation was breathtaking. It was a true masterpiece that tasted as heavenly as it looked.", author: "Dr. Nishantha Perera", event: "Grand Ballroom Reception" },
    { text: "Incredible attention to micro-details. Hands down the most elegant cake maker in Sri Lanka.", author: "Natasha & Michelle", event: "Couture Garden Wedding" },
    { text: "Their sugar flowers are an absolute work of fine art. Our guests could not believe they were edible.", author: "Imran Khan", event: "Luxury Corporate Jubilee" },
    { text: "The taste signature was completely custom and incredibly refined — not overly sweet, just perfect.", author: "Sophia Mendis", event: "Bespoke Birthday Banquet" },
    { text: "Exquisite professionalism. They synchronised with our layout designer down to the millimetre.", author: "Jonathan Wickramasinghe", event: "Idyllic Destination Gala" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Measure one copy of the track so we know the loop distance for the marquee
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.scrollWidth / 2);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [cakeCollection.length]);

  // Continuous auto-scroll marquee (top, draggable row) — pauses the
  // instant the customer interacts (drag, hover, touch) and quietly
  // resumes a couple seconds after they let go.
  useEffect(() => {
    if (!trackWidth || isCarouselActive) return;

    let frame;
    const speed = 38; // px per second
    let last = performance.now();

    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = autoX.get() - speed * dt;
      if (next <= -trackWidth) next += trackWidth;
      autoX.set(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trackWidth, isCarouselActive, autoX]);

  const pauseCarousel = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setIsCarouselActive(true);
  };

  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsCarouselActive(false), 1800);
  };

  // Keep the visual position continuous when the loop wraps mid-drag
  const wrapPosition = () => {
    if (!trackWidth) return;
    let x = autoX.get();
    if (x <= -trackWidth) x += trackWidth;
    if (x > 0) x -= trackWidth;
    autoX.set(x);
  };

  const nextReview = () => setActiveReview((prev) => (prev + 1) % testimonials.length);
  const prevReview = () => setActiveReview((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="w-full bg-[#FBF8F3] text-[#11302E] selection:bg-[#C99A44] selection:text-white">

      {/* ============ SECTION 1 — HERO ============ */}
      <section id="home" className="min-h-screen pt-28 pb-20 flex items-center justify-center px-6 lg:px-16 relative bg-[#FBF8F3] overflow-hidden">

        {/* Subtle fixed tier-stack watermark instead of spinning gradient blobs */}
        <TierMark tone="saffron" className="absolute top-24 right-10 w-24 h-10 opacity-[0.18] -z-0 hidden lg:block" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(201,154,68,0.08),transparent_45%)] -z-0" />

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 relative">

          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>

              <div className="inline-flex items-center gap-3 mb-6 justify-center lg:justify-start">
                <TierMark className="w-9 h-4" tone="claret" />
                <span className="text-[10px] uppercase tracking-[0.35em] text-[#8C4450] font-sans font-semibold">
                  Ceylon's House of Pastry Couture
                </span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl font-light tracking-tight text-[#11302E] leading-[1.05] mb-6">
                Cakes carved like
                <br />
                <span className="italic font-normal text-[#8C4450]">heirloom jewellery.</span>
              </h1>

              <p className="font-sans text-sm sm:text-base text-[#6B6661] leading-relaxed font-light mb-9 max-w-xl mx-auto lg:mx-0">
                Each tier hand-built, hand-painted and tasted before it ever reaches you —
                bespoke confectionery for the milestones of Sri Lanka's most discerning hosts.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentPage('gallery')}
                  className="bg-[#11302E] text-white text-[11px] uppercase tracking-[0.2em] px-10 py-4.5 transition-colors duration-300 cursor-pointer shadow-lg shadow-[#11302E]/15 hover:bg-[#8C4450] rounded-xl font-semibold"
                >
                  Enter The Gallery
                </motion.button>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center text-[11px] uppercase tracking-[0.2em] px-10 py-4.5 border border-[#11302E]/15 text-[#11302E] hover:border-[#C99A44] hover:text-[#8C4450] transition-colors duration-300 rounded-xl font-semibold"
                >
                  Book A Tasting
                </a>
              </div>
            </motion.div>
          </div>

          {/* Hero slideshow — Ken Burns drift + directional slide transition */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-md aspect-4/5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full bg-white overflow-hidden shadow-2xl shadow-[#11302E]/10 border border-[#11302E]/8 relative rounded-3xl group"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={heroImageIndex}
                    initial={{ opacity: 0, x: 36 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -36 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 overflow-hidden rounded-3xl"
                  >
                    {/* Ken Burns drift: slow continuous zoom + pan for as long as the slide is showing */}
                    <motion.img
                      src={heroSlides[heroImageIndex]}
                      alt="Ceylon Cakes signature creation"
                      initial={{ scale: 1.05, x: 0, y: 0 }}
                      animate={{ scale: 1.16, x: -14, y: -10 }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="w-full h-full object-cover select-none pointer-events-none rounded-3xl"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-[#11302E]/15 via-transparent to-transparent pointer-events-none rounded-3xl" />

                {/* Slide indicators */}
                <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroImageIndex(i)}
                      aria-label={`Show slide ${i + 1}`}
                      className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${i === heroImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                animate={{ rotate: [0, 2, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-5 -left-5 w-28 h-28 border border-[#C99A44]/40 -z-10 rounded-2xl"
              />
              <div className="absolute -top-5 -right-5 w-16 h-16 border border-[#8C4450]/25 -z-10 rounded-2xl" />
            </div>
          </div>

        </div>
      </section>

      {/* ============ SECTION 2 — ABOUT ============ */}
      <section id="about" className="py-32 px-8 bg-white border-y border-[#11302E]/8 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          <motion.div
            {...dropIn()}
            className="lg:col-span-5 aspect-4/5 max-w-sm mx-auto lg:w-full bg-[#FBF8F3] overflow-hidden p-4 border border-[#11302E]/8 shadow-xl shadow-[#11302E]/5 rounded-3xl relative group"
          >
            <img
              src="https://res.cloudinary.com/dtscqhcop/image/upload/v1782094972/WhatsApp_Image_2026-06-21_at_15.43.00_q7jie7.jpg"
              alt="Ceylon Cakes pastry artisan at work"
              className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700 rounded-2xl"
            />
          </motion.div>

          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <TierMark className="w-8 h-3.5" tone="saffron" />
              <span className="text-xs uppercase tracking-[0.3em] text-[#C99A44] font-sans font-semibold">The Design House</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#11302E] tracking-tight leading-tight font-light">
              Built tier by tier,
              <br />
              <span className="italic text-[#8C4450] font-normal">never off a shelf.</span>
            </h2>
            <p className="font-sans text-sm text-[#6B6661] font-light leading-8">
              Ceylon Cakes began with a simple refusal: no two celebrations are the same, so no
              two cakes should be either. Every commission starts as a sketch and a conversation —
              your colours, your story, your venue — before it ever touches sugar.
            </p>
            <p className="font-sans text-sm text-[#6B6661] font-light leading-8">
              From structural engineering beneath the icing to the final hand-piped detail, the
              work is shaped entirely by hand in our Colombo atelier, built to travel and built
              to be remembered.
            </p>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3 — METRICS ============ */}
      <section className="py-24 bg-[#11302E] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,154,68,0.10),transparent_60%)]" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px relative z-10 border border-white/10 rounded-2xl overflow-hidden md:divide-x divide-white/10">
          {[
            { value: 6, suffix: "+", label: "Years Of Craft" },
            { value: 1000, suffix: "+", label: "Bespoke Cakes Delivered" },
            { value: 300, suffix: "+", label: "Celebrations Hosted" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              {...dropIn(i * 0.12)}
              className="py-12 px-8"
            >
              <div className="font-serif text-5xl text-[#C99A44] font-light tracking-tight mb-2">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ SECTION 4 — ARCHIVE CAROUSEL ============ */}
      <section id="offerings" className="py-32 bg-[#FBF8F3] overflow-hidden relative border-b border-[#11302E]/8">
        <motion.div
          {...dropIn()}
          className="max-w-7xl mx-auto px-8 mb-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-end"
        >
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-2">
              <TierMark className="w-8 h-3.5" tone="claret" />
              <span className="text-xs uppercase tracking-[0.3em] text-[#8C4450] font-sans font-semibold">The Atelier Archive</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#11302E] tracking-tight">Twenty signature designs, three rows.</h2>
          </div>
          <div className="md:col-span-4 md:text-right">
            <p className="font-sans text-xs text-[#6B6661] font-light leading-relaxed">
              The top row is yours to drag — the two below glide on their own, drifting in opposite directions.
            </p>
          </div>
        </motion.div>

        {/* Row 1 — manual + auto, drag-enabled (the original archive row) */}
        <div
          ref={carouselRef}
          className="relative w-full py-4 overflow-hidden px-8"
          onMouseEnter={pauseCarousel}
          onMouseLeave={scheduleResume}
        >
          {/* Soft edge fades so the loop point never looks cut off */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10" />

          <motion.div
            ref={trackRef}
            style={{ x: autoX }}
            drag="x"
            dragConstraints={{ left: -trackWidth * 2, right: trackWidth }}
            dragElastic={0.08}
            dragTransition={{ power: 0.25, timeConstant: 200 }}
            onDragStart={pauseCarousel}
            onDragEnd={() => { wrapPosition(); scheduleResume(); }}
            onPointerDown={pauseCarousel}
            onTouchStart={pauseCarousel}
            className="flex gap-6 cursor-grab active:cursor-grabbing w-max select-none"
          >
            {[...cakeCollection, ...cakeCollection].map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 17,
                  delay: Math.min(index, cakeCollection.length - 1) * 0.05
                }}
                whileHover={{ y: -6 }}
                className="w-40 sm:w-48 aspect-3/4 overflow-hidden bg-white shadow-md border border-[#11302E]/8 relative shrink-0 rounded-2xl"
              >
                <img
                  src={src}
                  alt={`Archive piece ${(index % cakeCollection.length) + 1}`}
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none grayscale-[0.12] hover:grayscale-0 transition-all duration-500 rounded-2xl"
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Play / pause indicator — quiet confirmation of which mode it's in */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isCarouselActive ? 'bg-[#11302E]/20' : 'bg-[#C99A44] animate-pulse'}`} />
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#6B6661]/70">
              {isCarouselActive ? 'Paused — drag to browse' : 'Auto-playing'}
            </span>
          </div>
        </div>

        {/* Rows 2 & 3 — passive ambient rows, opposite directions, smaller cards */}
        <div className="mt-10 space-y-5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10" />
            <MarqueeRow images={rowFront} direction="right" speed={30} cardClass="w-28 sm:w-36 aspect-3/4" roundedClass="rounded-2xl" />
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10" />
            <MarqueeRow images={rowBack} direction="left" speed={30} cardClass="w-28 sm:w-36 aspect-3/4" roundedClass="rounded-2xl" />
          </div>
        </div>
      </section>

      {/* ============ SECTION 4.5 — FLORAL BOUQUETS ============ */}
      <section id="bouquets" className="py-32 px-6 lg:px-16 bg-white border-b border-[#11302E]/8 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[#C99A44]/[0.06] pointer-events-none select-none hidden lg:block">
          <Flower2 size={220} strokeWidth={0.6} />
        </div>

        <motion.div
          {...dropIn()}
          className="max-w-3xl mx-auto text-center mb-16 relative z-10"
        >
          <div className="inline-flex items-center gap-3 mb-4 justify-center">
            <TierMark className="w-9 h-4" tone="saffron" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C99A44] font-sans font-semibold">
              Hand-Piped Florals
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#11302E] font-light tracking-tight leading-tight">
            Sugar bouquets, grown
            <br />
            <span className="italic text-[#8C4450] font-normal">petal by petal.</span>
          </h2>
          <p className="font-sans text-sm text-[#6B6661] font-light leading-relaxed mt-5 max-w-xl mx-auto">
            Every bloom on a Ceylon Cakes commission is piped, shaped and tinted entirely by
            hand — peonies, ranunculus and trailing orchids that hold their form long after
            the last slice is served.
          </p>
        </motion.div>

        {/* Staggered bouquet grid — each piece drops and settles, slightly
            offset and rotated, like blooms being laid out one by one.
            These stay circular (rounded-full) by design — already round. */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6 relative z-10">
          {bouquetCollection.map((src, i) => {
            const rotations = [-3, 2, -2, 3, -2.5, 2.5];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -90, rotate: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, rotate: rotations[i % rotations.length], scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: i * 0.1 }}
                whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
                className={`aspect-square overflow-hidden bg-[#FBF8F3] shadow-lg border-2 border-white relative rounded-full ${i % 3 === 1 ? 'mt-6' : ''}`}
              >
                <img
                  src={src}
                  alt={`Floral bouquet detail ${i + 1}`}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-[#11302E]/8 rounded-full pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-14 relative z-10"
        >
          <a
            href="#contact"
            className="inline-flex items-center justify-center text-[11px] uppercase tracking-[0.2em] px-10 py-4 border border-[#11302E]/15 text-[#11302E] hover:border-[#C99A44] hover:text-[#8C4450] transition-colors duration-300 rounded-xl font-semibold"
          >
            Request A Floral Consultation
          </a>
        </motion.div>
      </section>

      {/* ============ SECTION 5 — TESTIMONIALS ============ */}
      <section id="reviews" className="py-32 px-6 lg:px-16 bg-[#EEF1F4] border-y border-[#11302E]/8 relative overflow-hidden">

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          <motion.div {...dropIn()} className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5">
              <TierMark className="w-8 h-3.5" tone="saffron" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold font-sans text-[#C99A44]">Praised Journeys</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#11302E] font-light tracking-tight leading-tight">
              Words from our
              <br /><span className="italic text-[#8C4450] font-normal">distinguished patrons.</span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6B6661] font-light leading-relaxed max-w-sm mx-auto lg:mx-0">
              Real reflections from weddings, galas and milestone evenings across the island.
            </p>
          </motion.div>

          <motion.div {...dropIn(0.1)} className="lg:col-span-7 w-full">
            <div className="bg-white border border-[#11302E]/8 p-8 sm:p-14 shadow-xl shadow-[#11302E]/5 relative flex flex-col items-center lg:items-start text-center lg:text-left rounded-3xl">

              <Quote size={64} className="absolute top-6 right-8 text-[#11302E]/5 stroke-[0.5] pointer-events-none select-none" />

              <div className="min-h-48 sm:min-h-32 flex items-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReview}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="w-full"
                  >
                    <p className="font-serif text-base sm:text-lg md:text-xl font-light text-[#11302E] leading-relaxed mb-6 italic">
                      "{testimonials[activeReview].text}"
                    </p>
                    <div className="w-10 h-px bg-[#C99A44] mb-4 mx-auto lg:mx-0" />
                    <h4 className="font-sans text-xs uppercase tracking-widest text-[#11302E] font-semibold">
                      {testimonials[activeReview].author}
                    </h4>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-[#8C4450] mt-1">
                      {testimonials[activeReview].event}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center w-full mt-8 pt-6 border-t border-[#11302E]/8">
                <div className="flex space-x-1.5">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveReview(i)}
                      aria-label={`Show testimonial ${i + 1}`}
                      className={`h-0.5 transition-all duration-500 cursor-pointer rounded-full ${activeReview === i ? 'w-8 bg-[#8C4450]' : 'w-2 bg-[#11302E]/15'}`}
                    />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button onClick={prevReview} aria-label="Previous testimonial" className="p-2.5 border border-[#11302E]/12 hover:border-[#C99A44] hover:text-[#8C4450] text-[#11302E] transition-colors cursor-pointer rounded-full bg-white">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={nextReview} aria-label="Next testimonial" className="p-2.5 border border-[#11302E]/12 hover:border-[#C99A44] hover:text-[#8C4450] text-[#11302E] transition-colors cursor-pointer rounded-full bg-white">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ============ SECTION 6 — CONTACT ============ */}
      <section id="contact" className="py-32 px-6 lg:px-16 bg-[#FBF8F3] relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          <motion.div {...dropIn()} className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <TierMark className="w-8 h-3.5" tone="claret" />
              <span className="text-xs uppercase tracking-[0.3em] text-[#8C4450] font-sans font-semibold">Registry Consultation</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#11302E] font-light tracking-tight">
              Begin your consultation.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6B6661] font-light leading-7">
              Share your celebration details below. Our concierge team will follow up with
              visual references and confirm availability within 24 hours.
            </p>

            <div className="pt-6 space-y-4 border-t border-[#11302E]/8">
              <div className="flex items-center space-x-4">
                <Mail size={14} className="text-[#8C4450]" />
                <span className="font-sans text-[11px] uppercase tracking-widest text-[#6B6661]">kaweesha38@gmail.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <Phone size={14} className="text-[#8C4450]" />
                <span className="font-sans text-[11px] uppercase tracking-widest text-[#6B6661]">+94 77 162 3424</span>
              </div>
              <div className="flex items-center space-x-4">
                <MapPin size={14} className="text-[#8C4450]" />
                <span className="font-sans text-[11px] uppercase tracking-widest text-[#6B6661]">Aluthgama, Sri Lanka</span>
              </div>
            </div>
          </motion.div>

          <motion.div {...dropIn(0.1)} className="lg:col-span-7 bg-white p-8 sm:p-12 border border-[#11302E]/8 shadow-xl shadow-[#11302E]/5 rounded-3xl">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="relative">
                  <input type="text" id="name" required className="w-full border-b border-[#11302E]/15 py-2 focus:outline-none focus:border-[#C99A44] text-xs font-light tracking-wide transition-colors peer bg-transparent z-10 relative" placeholder=" " />
                  <label htmlFor="name" className="absolute left-0 top-2 text-[10px] uppercase tracking-widest text-[#6B6661] transition-all duration-300 peer-placeholder-shown:text-xs peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-[9px] peer-focus:text-[#8C4450]">Full Name</label>
                </div>
                <div className="relative">
                  <input type="date" id="date" required className="w-full border-b border-[#11302E]/15 py-2 focus:outline-none focus:border-[#C99A44] text-xs font-light tracking-wide transition-colors peer bg-transparent z-10 relative" />
                </div>
              </div>
              <div className="relative">
                <input type="email" id="email" required className="w-full border-b border-[#11302E]/15 py-2 focus:outline-none focus:border-[#C99A44] text-xs font-light tracking-wide transition-colors peer bg-transparent z-10 relative" placeholder=" " />
                <label htmlFor="email" className="absolute left-0 top-2 text-[10px] uppercase tracking-widest text-[#6B6661] transition-all duration-300 peer-placeholder-shown:text-xs peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-[9px] peer-focus:text-[#8C4450]">Email Address</label>
              </div>
              <div className="relative">
                <textarea id="message" rows="4" required className="w-full border-b border-[#11302E]/15 py-2 focus:outline-none focus:border-[#C99A44] text-xs font-light tracking-wide transition-colors resize-none peer bg-transparent z-10 relative" placeholder=" " />
                <label htmlFor="message" className="absolute left-0 top-2 text-[10px] uppercase tracking-widest text-[#6B6661] transition-all duration-300 peer-placeholder-shown:text-xs peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-[9px] peer-focus:text-[#8C4450]">Celebration Specifics</label>
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#11302E] text-white text-[10px] font-sans uppercase tracking-[0.2em] py-4 hover:bg-[#8C4450] transition-colors duration-300 cursor-pointer shadow-lg font-medium rounded-xl"
              >
                Submit Registry Request
              </motion.button>
            </form>
          </motion.div>

        </div>
      </section>

    </div>
  );
}