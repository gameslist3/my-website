export function askAgent(query: string): { answer: string; generic: boolean } {
  const q = query.toLowerCase();

  if (q.includes("who") || q.includes("about") || q.includes("yourself")) {
    return {
      answer: "I’m Shubham Roy, a Senior UI/UX and Product Designer based in India, with over 5 years of experience designing digital products for web and mobile platforms. My work focuses on creating intuitive, scalable, and visually refined experiences that solve real user and business problems.",
      generic: false
    };
  }

  if (q.includes("experience") || q.includes("work") || q.includes("past") || q.includes("project")) {
    return {
      answer: "Over the years, I’ve worked across SaaS platforms, AI-driven products, dashboards, eCommerce experiences, rental commerce systems, enterprise tools, and modern websites. I enjoy transforming complex workflows into clean and user-friendly experiences through strong product thinking.",
      generic: false
    };
  }

  if (q.includes("philosophy") || q.includes("approach") || q.includes("believe") || q.includes("think") || q.includes("process")) {
    return {
      answer: "I believe great design is not just about visuals. A product should feel natural, efficient, and easy to understand. My goal is always to reduce friction, simplify complexity, and create experiences that users can navigate with confidence.",
      generic: false
    };
  }

  if (q.includes("tool") || q.includes("software") || q.includes("figma") || q.includes("use")) {
    return {
      answer: "I primarily use Figma for UI/UX and design systems. I also use Sketch, Adobe XD, Photoshop, Illustrator, Premiere Pro, Relume, Stitch, and various AI tools.",
      generic: false
    };
  }

  if (q.includes("goal") || q.includes("future") || q.includes("long term") || q.includes("long-term")) {
    return {
      answer: "My long-term goal is to grow into a stronger product-focused design leader, contribute to product strategy, and continue building scalable and impactful digital experiences.",
      generic: false
    };
  }

  if (q.includes("stay updated") || q.includes("learn") || q.includes("trend")) {
    return {
      answer: "I stay updated by following design communities, studying product case studies, exploring new AI tools, watching UX breakdowns, and continuously practicing modern workflows and systems.",
      generic: false
    };
  }

  if (q.includes("hi") || q.includes("hello") || q.includes("hey")) {
    return {
      answer: "Hello! I am an AI assistant representing Shubham Roy. You can ask me about his experience, tools, design philosophy, or long-term goals.",
      generic: false
    };
  }

  return {
    answer: "I couldn't find an exact answer to that in my current knowledge base, but I'd love to chat more!",
    generic: true
  };
}
