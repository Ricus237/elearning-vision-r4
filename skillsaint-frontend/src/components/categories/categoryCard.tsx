
"use client";

import { CategoryType } from "@/types/CategoryType";
import Image from "next/image";
import { ReactElement } from "react";

import {
  Briefcase,
  DesktopComputer,
  PaintBrush,
  ShieldCheck,
  Sparkles,
  Video,
  BookOpen,
  Cross,
  Church,
  Heart,
  Music,
  Globe,
  Star,
  MessageCircle,
  Flame,
  Users,
  Feather,
  Anchor,
} from "@/lib/icons";

function categoryIconFinder(category: string): ReactElement {
  const icons: Record<string, ReactElement> = {
    // Theology categories
    "Biblical Studies": <BookOpen />,
    "Church History": <Church />,
    "Theology & Doctrine": <Cross />,
    "Christian Living": <Heart />,
    "Praise & Worship": <Music />,
    "Missions & Evangelism": <Globe />,
    "Prayer & Spirituality": <Flame />,
    "Apologetics": <Anchor />,
    "Christian Leadership": <Users />,
    "Eschatology": <Star />,
    "Homiletics": <MessageCircle />,
    "Biblical Languages": <Feather />,
    // Original tech categories (kept for backward compat)
    "Web Development": <DesktopComputer />,
    "UI/UX Design": <PaintBrush />,
    "Digital Marketing": <Briefcase />,
    "Video Editing": <Video />,
    "Cyber Security": <ShieldCheck />,
    "Artificial Intelligence": <Sparkles />,
  };
  return icons[category] ?? <BookOpen />;
}

// ─── Category → Spiritual theme tags mapping ─────────────────────────────────
const THEME_TAGS: Record<string, string[]> = {
  "Biblical Studies":       ["Exegesis", "Hermeneutics", "Sacred Texts"],
  "Church History":         ["Reformation", "Early Church", "Councils"],
  "Theology & Doctrine":   ["Soteriology", "Christology", "Trinity"],
  "Christian Living":       ["Sanctification", "Discernment", "Fruitfulness"],
  "Praise & Worship":      ["Hymns", "Psalms", "Liturgy"],
  "Missions & Evangelism": ["Witnessing", "Church Planting", "Kerygma"],
  "Prayer & Spirituality":  ["Contemplation", "Intercession", "Fasting"],
  "Apologetics":           ["Faith Defense", "Dialogue", "Reasoning"],
  "Christian Leadership":    ["Pastoral", "Diaconia", "Governance"],
  "Eschatology":           ["Parousia", "Millennium", "Last Judgment"],
  "Homiletics":            ["Preaching", "Rhetoric", "Kerygma"],
  "Biblical Languages":      ["Hebrew", "Koine Greek", "Aramaic"],
};

function getThemeTags(title: string): string[] {
  return THEME_TAGS[title] ?? [];
}

// ─── Decorative SVG cross watermark ──────────────────────────────────────────
const CrossWatermark = () => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: "absolute",
      bottom: "-8px",
      right: "-8px",
      width: "88px",
      height: "88px",
      opacity: 0.045,
      pointerEvents: "none",
    }}
  >
    <rect x="34" y="4" width="12" height="72" rx="6" fill="currentColor" />
    <rect x="4" y="24" width="72" height="12" rx="6" fill="currentColor" />
  </svg>
);

// ─── Tag pill ─────────────────────────────────────────────────────────────────
const TagPill = ({ label, index }: { label: string; index: number }) => {
  const tagStyles = [
    { bg: "rgba(125, 82, 244, 0.1)", color: "#7D52F4", border: "rgba(125, 82, 244, 0.2)" },  // Purple
    { bg: "rgba(123, 184, 212, 0.1)", color: "#3B7EA1", border: "rgba(123, 184, 212, 0.2)" },  // Sky
    { bg: "rgba(113, 119, 132, 0.1)", color: "#525866", border: "rgba(113, 119, 132, 0.2)" },  // Gray
  ];
  const s = tagStyles[index % 3];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        letterSpacing: "0.02em",
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const CategoryCard = ({ category }: { category: CategoryType }) => {
  const tags = getThemeTags(category.title);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
        padding: "28px 28px 24px",
        background: "white",
        border: "1.5px solid rgba(125, 82, 244, 0.08)",
        boxShadow: "0 4px 12px rgba(125, 82, 244, 0.03), 0 1px 2px rgba(125, 82, 244, 0.02)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 20px 40px rgba(125, 82, 244, 0.1), 0 8px 16px rgba(125, 82, 244, 0.05)";
        el.style.borderColor = "rgba(125, 82, 244, 0.2)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 4px 12px rgba(125, 82, 244, 0.03), 0 1px 2px rgba(125, 82, 244, 0.02)";
        el.style.borderColor = "rgba(125, 82, 244, 0.08)";
      }}
    >
      {/* Decorative cross watermark */}
      <CrossWatermark />

      {/* Decorative top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "24px",
          right: "24px",
          height: "2.5px",
          borderRadius: "0 0 4px 4px",
          background:
            "linear-gradient(90deg, transparent, rgba(125, 82, 244, 0.4), transparent)",
        }}
      />

      {/* Header row: icon + course count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        {/* Icon badge */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #7D52F4 0%, #693EE0 100%)",
            boxShadow: "0 8px 16px rgba(125, 82, 244, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
          }}
        >
          {category.image ? (
            <Image
              src={category.image}
              alt={category.title}
              width={26}
              height={26}
            />
          ) : (
            categoryIconFinder(category.title)
          )}
        </div>

        {/* Course count badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "999px",
            background: "rgba(123, 184, 212, 0.12)",
            border: "1px solid rgba(123, 184, 212, 0.3)",
          }}
        >
          {/* Small dot indicator */}
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#3B7EA1",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#3B7EA1",
              letterSpacing: "0.01em",
            }}
          >
            {category.courseCount}{" "}
            {category.courseCount > 1 ? "Courses" : "Course"}
          </span>
        </div>
      </div>

      {/* Title */}
      <h5
        style={{
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: "19px",
          fontWeight: 700,
          lineHeight: 1.3,
          color: "#0E121B",
          marginBottom: "8px",
          letterSpacing: "-0.01em",
        }}
      >
        {category.title}
      </h5>

      {/* Description */}
      <p
        style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "#525866",
          marginBottom: "16px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          letterSpacing: "0.01em",
        }}
      >
        {category.description}
      </p>

      {/* Divider */}
      {tags.length > 0 && (
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(125, 82, 244, 0.15), transparent)",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Spiritual theme tags */}
      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          {tags.map((tag, i) => (
            <TagPill key={tag} label={tag} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryCard;