"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, MotionProps, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, Terminal as TerminalIcon } from "lucide-react";

interface SequenceContextValue {
  completeItem: (index: number) => void;
  activeIndex: number;
  sequenceStarted: boolean;
}

const SequenceContext = createContext<SequenceContextValue | null>(null);
const useSequence = () => useContext(SequenceContext);
const ItemIndexContext = createContext<number | null>(null);
const useItemIndex = () => useContext(ItemIndexContext);

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  startOnView?: boolean;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  startOnView = false,
  ...props
}: AnimatedSpanProps) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });

  const sequence = useSequence();
  const itemIndex = useItemIndex();
  const shouldAnimate = sequence
    ? sequence.sequenceStarted && itemIndex !== null && sequence.activeIndex === itemIndex
    : startOnView
      ? isInView
      : true;

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: -5 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
      transition={{ duration: 0.3, delay: sequence ? 0 : delay / 1000 }}
      className={cn("grid text-sm font-normal tracking-tight", className)}
      onAnimationComplete={() => {
        if (!sequence) return;
        if (itemIndex === null) return;
        sequence.completeItem(itemIndex);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
  startOnView?: boolean;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string.");
  }

  const MotionComponent = useMemo(
    () =>
      motion.create(Component, {
        forwardMotionProps: true,
      }),
    [Component]
  );

  const [displayedText, setDisplayedText] = useState<string>("");
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(elementRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });

  const sequence = useSequence();
  const itemIndex = useItemIndex();

  useEffect(() => {
    if (sequence && itemIndex !== null) {
      if (!sequence.sequenceStarted) return;
      if (started) return;
      if (sequence.activeIndex === itemIndex) {
        setStarted(true);
      }
      return;
    }

    if (!startOnView) {
      const startTimeout = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(startTimeout);
    }

    if (!isInView) return;

    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [
    delay,
    startOnView,
    isInView,
    started,
    sequence,
    sequence?.activeIndex,
    sequence?.sequenceStarted,
    itemIndex,
  ]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
        if (sequence && itemIndex !== null) {
          sequence.completeItem(itemIndex);
        }
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started, sequence, itemIndex]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
  sequence?: boolean;
  startOnView?: boolean;
  title?: string;
}

export const Terminal = ({
  children,
  className,
  sequence = true,
  startOnView = true,
  title = "Terminal",
}: TerminalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const sequenceHasStarted = sequence ? !startOnView || isInView : false;

  const contextValue = useMemo<SequenceContextValue | null>(() => {
    if (!sequence) return null;
    return {
      completeItem: (index: number) => {
        setActiveIndex((current) => (index === current ? current + 1 : current));
      },
      activeIndex,
      sequenceStarted: sequenceHasStarted,
    };
  }, [sequence, activeIndex, sequenceHasStarted]);

  const wrappedChildren = useMemo(() => {
    if (!sequence) return children;
    const array = Children.toArray(children);
    return array.map((child, index) => (
      <ItemIndexContext.Provider key={index} value={index}>
        {child as React.ReactNode}
      </ItemIndexContext.Provider>
    ));
  }, [children, sequence]);

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "border border-border bg-[#0d1117] z-0 h-full w-full rounded-xl overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex flex-row gap-x-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
            <div className="h-3 w-3 rounded-full bg-[#febc2e]"></div>
            <div className="h-3 w-3 rounded-full bg-[#28c840]"></div>
          </div>
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{title}</span>
          </div>
        </div>
      </div>
      <pre className="p-5 lg:p-6 overflow-auto max-h-[400px]">
        <code className="grid gap-y-1.5 text-gray-300 font-mono text-sm leading-relaxed">
          {wrappedChildren}
        </code>
      </pre>
    </div>
  );

  if (!sequence) return content;

  return (
    <SequenceContext.Provider value={contextValue}>
      {content}
    </SequenceContext.Provider>
  );
};

// Code Block Component
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock = ({
  code,
  language = "bash",
  title,
  showLineNumbers = false,
  className,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div
      className={cn(
        "border border-border bg-[#0d1117] rounded-xl overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {title || language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 lg:p-6 overflow-auto max-h-[500px]">
        <code className="text-gray-300 font-mono text-sm leading-relaxed">
          {showLineNumbers ? (
            lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-gray-600 w-8 text-right pr-4">
                  {i + 1}
                </span>
                <span>{line}</span>
              </div>
            ))
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
};

// API Endpoint Component
interface ApiEndpointProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  title?: string;
}

export const ApiEndpoint = ({ method, path, title }: ApiEndpointProps) => {
  const methodColors = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-[#161b22] rounded-xl border border-border">
      <span
        className={cn(
          "px-3 py-1.5 rounded-md text-xs font-bold border",
          methodColors[method]
        )}
      >
        {method}
      </span>
      <code className="text-sm text-gray-300 font-mono flex-1">{path}</code>
      {title && (
        <span className="ml-auto text-xs text-muted-foreground">{title}</span>
      )}
    </div>
  );
};

