import React, { useState } from 'react';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiRust,
  SiGo,
  SiNodedotjs,
  SiReact,
  SiDeno,
  SiBun,
  SiNextdotjs,
  SiVuedotjs,
  SiAngular,
  SiSvelte,
  SiVite,
  SiWebpack,
  SiExpress,
  SiDocker,
  SiKubernetes,
  SiRedis,
  SiJest,
  SiVitest,
  SiTailwindcss,
  SiPrisma,
  SiNeo4J,
  SiGraphql,
  SiPostgresql,
  SiMongodb,
  SiFastify,
  SiNestjs,
  SiEslint,
  SiPrettier,
  SiZod,
  SiAxios,
  SiLodash,
  SiRabbitmq,
  SiApachekafka,
  SiGrafana,
  SiPrometheus,
  SiGithubactions,
  SiTerraform,
  SiSentry,
  SiStorybook,
  SiCypress,
  SiMocha,
  SiBabel,
  SiRollupdotjs,
  SiGatsby,
  SiSpring,
  SiFlask,
  SiDjango,
  SiSocketdotio,
  SiSwagger,
  SiNginx,
  SiApache,
  SiLinux,
  SiGooglecloud,
} from 'react-icons/si';
import { FaAws } from 'react-icons/fa6';
import { Layers } from 'lucide-react';

interface ToolIconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Icon mappings with exact official colors and real React Icons components
const ICON_MAP: Record<
  string,
  {
    component: React.ComponentType<{ className?: string; size?: number; color?: string }>;
    color: string;
    bg?: string;
    cdnSlug?: string;
  }
> = {
  javascript: { component: SiJavascript, color: '#F7DF1E', bg: '#000000', cdnSlug: 'javascript/javascript-original.svg' },
  js: { component: SiJavascript, color: '#F7DF1E', bg: '#000000', cdnSlug: 'javascript/javascript-original.svg' },
  typescript: { component: SiTypescript, color: '#3178C6', bg: '#ffffff', cdnSlug: 'typescript/typescript-original.svg' },
  ts: { component: SiTypescript, color: '#3178C6', bg: '#ffffff', cdnSlug: 'typescript/typescript-original.svg' },
  python: { component: SiPython, color: '#3776AB', cdnSlug: 'python/python-original.svg' },
  py: { component: SiPython, color: '#3776AB', cdnSlug: 'python/python-original.svg' },
  rust: { component: SiRust, color: '#CE412B', cdnSlug: 'rust/rust-original.svg' },
  rs: { component: SiRust, color: '#CE412B', cdnSlug: 'rust/rust-original.svg' },
  go: { component: SiGo, color: '#00ADD8', cdnSlug: 'go/go-original.svg' },
  golang: { component: SiGo, color: '#00ADD8', cdnSlug: 'go/go-original.svg' },
  'node.js': { component: SiNodedotjs, color: '#5FA04E', cdnSlug: 'nodejs/nodejs-original.svg' },
  nodejs: { component: SiNodedotjs, color: '#5FA04E', cdnSlug: 'nodejs/nodejs-original.svg' },
  node: { component: SiNodedotjs, color: '#5FA04E', cdnSlug: 'nodejs/nodejs-original.svg' },
  react: { component: SiReact, color: '#61DAFB', cdnSlug: 'react/react-original.svg' },
  'react-dom': { component: SiReact, color: '#61DAFB', cdnSlug: 'react/react-original.svg' },
  reactjs: { component: SiReact, color: '#61DAFB', cdnSlug: 'react/react-original.svg' },
  deno: { component: SiDeno, color: '#70E3EA', cdnSlug: 'denojs/denojs-original.svg' },
  bun: { component: SiBun, color: '#FBF0DF', cdnSlug: 'bun/bun-original.svg' },
  next: { component: SiNextdotjs, color: '#FFFFFF', cdnSlug: 'nextjs/nextjs-original.svg' },
  nextjs: { component: SiNextdotjs, color: '#FFFFFF', cdnSlug: 'nextjs/nextjs-original.svg' },
  vue: { component: SiVuedotjs, color: '#4FC08D', cdnSlug: 'vuejs/vuejs-original.svg' },
  vuejs: { component: SiVuedotjs, color: '#4FC08D', cdnSlug: 'vuejs/vuejs-original.svg' },
  angular: { component: SiAngular, color: '#DD0031', cdnSlug: 'angularjs/angularjs-original.svg' },
  svelte: { component: SiSvelte, color: '#FF3E00', cdnSlug: 'svelte/svelte-original.svg' },
  vite: { component: SiVite, color: '#646CFF', cdnSlug: 'vitejs/vitejs-original.svg' },
  webpack: { component: SiWebpack, color: '#8DD6F9', cdnSlug: 'webpack/webpack-original.svg' },
  express: { component: SiExpress, color: '#FFFFFF', cdnSlug: 'express/express-original.svg' },
  expressjs: { component: SiExpress, color: '#FFFFFF', cdnSlug: 'express/express-original.svg' },
  fastify: { component: SiFastify, color: '#000000', bg: '#ffffff', cdnSlug: 'fastify/fastify-original.svg' },
  nestjs: { component: SiNestjs, color: '#E0234E', cdnSlug: 'nestjs/nestjs-original.svg' },
  docker: { component: SiDocker, color: '#2496ED', cdnSlug: 'docker/docker-original.svg' },
  kubernetes: { component: SiKubernetes, color: '#326CE5', cdnSlug: 'kubernetes/kubernetes-plain.svg' },
  k8s: { component: SiKubernetes, color: '#326CE5', cdnSlug: 'kubernetes/kubernetes-plain.svg' },
  redis: { component: SiRedis, color: '#DC382D', cdnSlug: 'redis/redis-original.svg' },
  ioredis: { component: SiRedis, color: '#DC382D', cdnSlug: 'redis/redis-original.svg' },
  jest: { component: SiJest, color: '#C21325', cdnSlug: 'jest/jest-plain.svg' },
  vitest: { component: SiVitest, color: '#FCC72B', cdnSlug: 'vitest/vitest-original.svg' },
  mocha: { component: SiMocha, color: '#8D6748', cdnSlug: 'mocha/mocha-plain.svg' },
  cypress: { component: SiCypress, color: '#69D3A7' },
  playwright: { component: SiCypress, color: '#45BA4B' },
  tailwindcss: { component: SiTailwindcss, color: '#06B6D4', cdnSlug: 'tailwindcss/tailwindcss-original.svg' },
  tailwind: { component: SiTailwindcss, color: '#06B6D4', cdnSlug: 'tailwindcss/tailwindcss-original.svg' },
  prisma: { component: SiPrisma, color: '#2D3748', cdnSlug: 'prisma/prisma-original.svg' },
  neo4j: { component: SiNeo4J, color: '#008CC1', cdnSlug: 'neo4j/neo4j-original.svg' },
  'neo4j-driver': { component: SiNeo4J, color: '#008CC1', cdnSlug: 'neo4j/neo4j-original.svg' },
  graphql: { component: SiGraphql, color: '#E10098', cdnSlug: 'graphql/graphql-plain.svg' },
  postgresql: { component: SiPostgresql, color: '#4169E1', cdnSlug: 'postgresql/postgresql-original.svg' },
  postgres: { component: SiPostgresql, color: '#4169E1', cdnSlug: 'postgresql/postgresql-original.svg' },
  mongodb: { component: SiMongodb, color: '#47A248', cdnSlug: 'mongodb/mongodb-original.svg' },
  mongoose: { component: SiMongodb, color: '#47A248', cdnSlug: 'mongodb/mongodb-original.svg' },
  eslint: { component: SiEslint, color: '#4B32C3', cdnSlug: 'eslint/eslint-original.svg' },
  prettier: { component: SiPrettier, color: '#F7B93E' },
  zod: { component: SiZod, color: '#3E67B1' },
  axios: { component: SiAxios, color: '#5A29E4' },
  lodash: { component: SiLodash, color: '#3492FF' },
  rabbitmq: { component: SiRabbitmq, color: '#FF6600' },
  kafka: { component: SiApachekafka, color: '#FFFFFF' },
  grafana: { component: SiGrafana, color: '#F46800', cdnSlug: 'grafana/grafana-original.svg' },
  prometheus: { component: SiPrometheus, color: '#E6522C', cdnSlug: 'prometheus/prometheus-original.svg' },
  githubactions: { component: SiGithubactions, color: '#2088FF' },
  terraform: { component: SiTerraform, color: '#844FBA', cdnSlug: 'terraform/terraform-original.svg' },
  sentry: { component: SiSentry, color: '#362D59' },
  storybook: { component: SiStorybook, color: '#FF4785', cdnSlug: 'storybook/storybook-original.svg' },
  babel: { component: SiBabel, color: '#F9DC3E', cdnSlug: 'babel/babel-original.svg' },
  'babel-core': { component: SiBabel, color: '#F9DC3E', cdnSlug: 'babel/babel-original.svg' },
  rollup: { component: SiRollupdotjs, color: '#EC4A3F' },
  gatsby: { component: SiGatsby, color: '#663399', cdnSlug: 'gatsby/gatsby-original.svg' },
  nuxt: { component: SiGatsby, color: '#00DC82', cdnSlug: 'nuxtjs/nuxtjs-original.svg' },
  spring: { component: SiSpring, color: '#6DB33F', cdnSlug: 'spring/spring-original.svg' },
  flask: { component: SiFlask, color: '#000000', bg: '#ffffff', cdnSlug: 'flask/flask-original.svg' },
  django: { component: SiDjango, color: '#092E20', cdnSlug: 'django/django-plain.svg' },
  'socket.io': { component: SiSocketdotio, color: '#010101', bg: '#ffffff', cdnSlug: 'socketio/socketio-original.svg' },
  swagger: { component: SiSwagger, color: '#85EA2D', cdnSlug: 'swagger/swagger-original.svg' },
  nginx: { component: SiNginx, color: '#009639', cdnSlug: 'nginx/nginx-original.svg' },
  apache: { component: SiApache, color: '#D22128', cdnSlug: 'apache/apache-original.svg' },
  linux: { component: SiLinux, color: '#FCC624', cdnSlug: 'linux/linux-original.svg' },
  aws: { component: FaAws, color: '#FF9900', cdnSlug: 'amazonwebservices/amazonwebservices-original.svg' },
  gcp: { component: SiGooglecloud, color: '#4285F4', cdnSlug: 'googlecloud/googlecloud-original.svg' },
};

const PIXEL_SIZES = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 36,
};

const CONTAINER_SIZES = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

export const ToolIcon: React.FC<ToolIconProps> = ({ name, size = 'md', className = '' }) => {
  const norm = name.toLowerCase().trim();
  const matched = ICON_MAP[norm];
  const [imgError, setImgError] = useState(false);

  const px = PIXEL_SIZES[size];
  const containerClass = CONTAINER_SIZES[size];

  // If a known icon is found in our library
  if (matched) {
    const IconComponent = matched.component;

    // Optional CDN real SVG image with React-Icon component fallback
    if (matched.cdnSlug && !imgError) {
      return (
        <div
          className={`${containerClass} rounded-xl bg-[#181818] border border-white/[0.08] p-1.5 flex items-center justify-center shrink-0 shadow-sm ${className}`}
        >
          <img
            src={`https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${matched.cdnSlug}`}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        className={`${containerClass} rounded-xl bg-[#181818] border border-white/[0.08] flex items-center justify-center shrink-0 shadow-sm ${className}`}
        style={matched.bg ? { backgroundColor: matched.bg } : undefined}
      >
        <IconComponent size={px} color={matched.color} />
      </div>
    );
  }

  // Fallback for custom or unknown tools: try simpleicons CDN, else fallback to stylized tech glyph
  return (
    <div
      className={`${containerClass} rounded-xl bg-[#181818] border border-white/[0.08] p-1.5 flex items-center justify-center shrink-0 shadow-sm text-[#00d4d4] ${className}`}
    >
      {!imgError ? (
        <img
          src={`https://cdn.simpleicons.org/${norm}/00d4d4`}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <Layers size={px} className="text-[#00d4d4]" />
      )}
    </div>
  );
};

export default ToolIcon;
