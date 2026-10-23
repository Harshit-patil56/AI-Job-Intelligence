import * as React from "react";

export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}

/** Official GitHub Logo Mark */
export const GitHubLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    );
  }
);
GitHubLogoIcon.displayName = "GitHubLogoIcon";

/** Official LinkedIn 'in' Logo Mark */
export const LinkedInLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
        {...props}
      >
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }
);
LinkedInLogoIcon.displayName = "LinkedInLogoIcon";

/** Official Google Gemini Spark Logo (Simple Icons) */
export const GeminiLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 2.55 3.81t3.81 2.55Z" />
    </svg>
  )
);
GeminiLogoIcon.displayName = "GeminiLogoIcon";

/** Official Groq 'g' Speedmark Logo */
export const GroqLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 201 201"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="m128 49 1.895 1.52C136.336 56.288 140.602 64.49 142 73c.097 1.823.148 3.648.161 5.474l.03 3.247.012 3.482.017 3.613c.01 2.522.016 5.044.02 7.565.01 3.84.041 7.68.072 11.521.007 2.455.012 4.91.016 7.364l.038 3.457c-.033 11.717-3.373 21.83-11.475 30.547-4.552 4.23-9.148 7.372-14.891 9.73l-2.387 1.055c-9.275 3.355-20.3 2.397-29.379-1.13-5.016-2.38-9.156-5.17-13.234-8.925 3.678-4.526 7.41-8.394 12-12l3.063 2.375c5.572 3.958 11.135 5.211 17.937 4.625 6.96-1.384 12.455-4.502 17-10 4.174-6.784 4.59-12.222 4.531-20.094l.012-3.473c.003-2.414-.005-4.827-.022-7.241-.02-3.68 0-7.36.026-11.04-.003-2.353-.008-4.705-.016-7.058l.025-3.312c-.098-7.996-1.732-13.21-6.681-19.47-6.786-5.458-13.105-8.211-21.914-7.792-7.327 1.188-13.278 4.7-17.777 10.601C75.472 72.012 73.86 78.07 75 85c2.191 7.547 5.019 13.948 12 18 5.848 3.061 10.892 3.523 17.438 3.688l2.794.103c2.256.082 4.512.147 6.768.209v16c-16.682.673-29.615.654-42.852-10.848-8.28-8.296-13.338-19.55-13.71-31.277.394-9.87 3.93-17.894 9.562-25.875l1.688-2.563C84.698 35.563 110.05 34.436 128 49Z" />
    </svg>
  )
);
GroqLogoIcon.displayName = "GroqLogoIcon";

/** Official OpenRouter Logo (Dual Routing Arrows) */
export const OpenRouterLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z" fill="currentColor" stroke="none" />
      <path
        d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z" fill="currentColor" stroke="none" />
    </svg>
  )
);
OpenRouterLogoIcon.displayName = "OpenRouterLogoIcon";

/** Official Ollama Mascot Logo (Simple Icons) */
export const OllamaLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M16.361 10.26a.894.894 0 0 0-.558.47l-.072.148.001.207c0 .193.004.217.059.353.076.193.152.312.291.448.24.238.51.3.872.205a.86.86 0 0 0 .517-.436.752.752 0 0 0 .08-.498c-.064-.453-.33-.782-.724-.897a1.06 1.06 0 0 0-.466 0M7.158 10.265c-.305.096-.533.32-.65.639a1.2 1.2 0 0 0-.06.52c.057.309.31.59.598.667.362.095.632.033.872-.205.14-.136.215-.255.291-.448.055-.136.059-.16.059-.353l.001-.207-.072-.148a.894.894 0 0 0-.558-.47c-.033-.008-.066-.01-.1-.013-.028-.002-.056-.002-.083 0m4.661 2.004c-.131.071-.223.25-.195.383.031.143.157.288.353.407.105.063.112.072.117.136.004.038-.01.146-.029.243-.02.094-.036.194-.031.294.01.196.084.34.254.43.197.103.376.087.525-.054.124-.117.17-.267.152-.437-.024-.236-.098-.458-.236-.65-.123-.17-.291-.321-.498-.445-.134-.08-.277-.183-.343-.277zm.431 3.23c-.347.008-.667.112-.924.316-.217.172-.371.393-.439.65-.054.205-.05.418.01.62.062.206.182.385.345.52.339.284.772.384 1.197.273.342-.089.624-.305.814-.593.18-.272.247-.604.186-.932-.061-.322-.24-.602-.505-.792-.19-.136-.411-.203-.684-.202m-.378 1.408c-.067.042-.144.053-.222.029-.079-.024-.143-.081-.177-.156-.035-.077-.038-.166-.009-.246.029-.08.087-.145.161-.177.075-.033.161-.031.233.006.072.037.124.103.141.182.016.079.002.163-.04.232-.043.07-.107.116-.187.126m-7.23-7.531C2.569 9.947 1.3 11.666.529 13.722c-.62 1.637-.62 1.637 1.344 1.83 1.258.122 1.657.349 2.053 1.164.717 1.47 1.325 2.215 2.455 2.998 1.616 1.106 3.619 1.826 5.619 1.826 2 0 4.003-.72 5.619-1.826 1.13-.783 1.738-1.528 2.455-2.998.396-.815.795-1.042 2.053-1.164 1.964-.193 1.964-.193 1.344-1.83-.771-2.056-2.04-3.775-3.843-5.346C17.373 7.394 13.921 5.8 12 5.8s-5.373 1.594-7.461 3.568M12 4.195c2.37 0 4.717.65 6.786 1.879C16.914 2.871 14.542 1.2 12 1.2S7.086 2.871 5.214 6.074C7.283 4.845 9.63 4.195 12 4.195" />
    </svg>
  )
);
OllamaLogoIcon.displayName = "OllamaLogoIcon";

/** Official Logo.dev Geometric Logo Mark */
export const LogoDevLogoIcon = React.forwardRef<SVGSVGElement, BrandIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 377 377"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M355.884 233.53L200.743 345.634L195.121 349.432C186.68 355.135 175.296 349.087 175.296 338.9V21.7329C175.296 11.3299 163.481 5.33288 155.084 11.4729L5.208 121.062C1.935 123.455 0 127.267 0 131.322V354.473C0 361.493 5.69 367.183 12.71 367.183H363.328C370.348 367.183 376.038 361.493 376.038 354.473V243.832C376.038 233.462 364.289 227.457 355.884 233.53Z" />
      <path d="M298.29 172.44C331.721 172.44 358.822 145.339 358.822 111.908C358.822 78.4771 331.721 51.376 298.29 51.376C264.859 51.376 237.758 78.4771 237.758 111.908C237.758 145.339 264.859 172.44 298.29 172.44Z" />
    </svg>
  )
);
LogoDevLogoIcon.displayName = "LogoDevLogoIcon";
