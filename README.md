# Prasad JH Systems Portfolio

An interactive systems engineering portfolio for Prasad Jagadish Hemadri, an engineering student at Dr. Ambedkar Institute of Technology, Bengaluru.

[View the live portfolio](https://portfolio-nu-lemon-zzvhn4ejh5.vercel.app/)

- Drag nodes in the architecture graph to explore the stack and open GitHub or LinkedIn profiles.
- Stress-test UPIShield, fx_router, Online SGD Mind-Reader, and WikiGuard in a browser-based simulator. Adjust stress and inspect the topology, throughput, and P5, P50, and P95 latency.
- Read the four architecture briefs and explore the engineering workflow from algorithm design to interface.

Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Canvas. The simulator uses synthetic workloads and requires no backend or API keys.

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Run `npm run build` to type-check and generate the static site in `dist/`.
