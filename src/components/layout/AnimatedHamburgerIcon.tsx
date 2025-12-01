'use client';

import { motion, Variants } from 'framer-motion';

type Props = {
  isOpen: boolean;
  color?: string;
  strokeWidth?: string | number;
  className?: string;
};

const AnimatedHamburgerIcon = ({
  isOpen,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: Props) => {
  const topVariants: Variants = {
    closed: { rotate: 0, translateY: 0 },
    open: { rotate: 45, translateY: 7 },
  };

  const middleVariants: Variants = {
    closed: { opacity: 1 },
    open: { opacity: 0 },
  };

  const bottomVariants: Variants = {
    closed: { rotate: 0, translateY: 0 },
    open: { rotate: -45, translateY: -7 },
  };

  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <motion.line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke={color}
        strokeWidth={strokeWidth}
        variants={topVariants}
      />
      <motion.line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke={color}
        strokeWidth={strokeWidth}
        variants={middleVariants}
      />
      <motion.line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        stroke={color}
        strokeWidth={strokeWidth}
        variants={bottomVariants}
      />
    </motion.svg>
  );
};

export default AnimatedHamburgerIcon;
