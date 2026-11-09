import { useScene } from '../../context/SceneContext';
import '../../styles/ScreenReaderOverlay.scss';

const PROJECTS = [
    {
        title: 'AnomalyShield — Multi-Tenant ML WAF',
        description: 'Go middleware with a 25 ms evaluation timeout, fail-open circuit breakers and a FastAPI Isolation Forest engine with tenant-specific models, LRU caching, asynchronous logging and background retraining.',
        url: 'https://github.com/paarthM007/WAFproject'
    },
    {
        title: 'Supply Chain Disruption Oracle',
        description: 'Multimodal logistics routing, weather and news-sentiment risk fusion, and Monte Carlo discrete-event simulation across 1,100+ hubs.',
        url: 'https://github.com/paarthM007/SCDO'
    },
    {
        title: '2D Heat Conduction Solver',
        description: 'C++ finite-difference and SOR solver with a Node.js orchestrator and React heat-map dashboard.',
        url: 'https://hmt-project-paarth-mandelia.vercel.app'
    },
    {
        title: 'SAIL SMS-II Optimizer',
        description: 'SimPy discrete-event simulation and PuLP MILP scheduling for steel-melt-shop throughput and queue-delay optimization.',
        url: 'https://github.com/paarthM007/steel-plant-sms-optimizer'
    },
    {
        title: 'SAIL Spares Optimizer',
        description: 'ABC-FSN-VED inventory classification, dynamic safety stock, EOQ, reorder points and working-capital release planning.',
        url: 'https://github.com/paarthM007/sail_spares_optimizer'
    },
    {
        title: 'System Design Notes',
        description: 'Visual notes on scaling, rate limiting, consistent hashing, key-value stores, URL shorteners, crawlers and notification systems.',
        url: 'https://github.com/paarthM007/system-design-notes'
    }
];

const ACHIEVEMENTS = [
    'LeetCode Knight — 1904 rating, Top 5% globally',
    'Codeforces Specialist — maximum rating 1429',
    'CodeChef 3-Star — 1775 rating',
    '700+ problems solved across coding platforms',
    'JEE Advanced CRL 9624; JEE Main 98.63 percentile',
    'DAPC Junior-Year Student Representative, representing 90+ Mechanical Engineering students',
    'Student Technical Council Web Developer — highest contributor in 2026',
    'Sub-Coordinator, Market Division — Trading & Investment Club, IIT Patna'
];

const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();

    return (
        <div className="sr-overlay" role="complementary" aria-label="Accessible navigation for Paarth Mandelia's portfolio">
            <a href="#sr-main-nav" className="sr-only sr-focusable">Skip to accessible navigation</a>
            <nav id="sr-main-nav" className="sr-only" aria-label="Portfolio rooms">
                <h1>Paarth Mandelia — IIT Patna Mechanical Engineering Portfolio</h1>
                <h2>Portfolio Navigation</h2>
                {!hasEntered && (
                    <p>Welcome to Paarth Mandelia's interactive portfolio. Explore engineering, software, machine learning, systems and competitive-programming projects.</p>
                )}
                {hasEntered && !isInRoom && (
                    <>
                        <p>You are in the corridor. Choose a room to explore:</p>
                        <ul>
                            <li><button onClick={() => teleportTo('about')} type="button">About — education, achievements, leadership and skills</button></li>
                            <li><button onClick={() => teleportTo('gallery')} type="button">Projects — engineering, ML, backend and optimization work</button></li>
                            <li><button onClick={() => teleportTo('contact')} type="button">Contact — LinkedIn, GitHub and email</button></li>
                        </ul>
                    </>
                )}
                {hasEntered && isInRoom && (
                    <>
                        <p>You are in the {currentRoom === 'about' ? 'About' : currentRoom === 'gallery' ? 'Projects' : currentRoom === 'contact' ? 'Contact' : currentRoom} room.</p>
                        <button onClick={requestExit} type="button">Go back to corridor</button>
                        {currentRoom === 'about' && (
                            <section aria-label="About Paarth Mandelia">
                                <h3>About Paarth</h3>
                                <p>Paarth Mandelia is a B.Tech Mechanical Engineering undergraduate at IIT Patna (2024–2028), with a CGPA of 8.67. His interests and work span competitive programming, machine learning, backend engineering, numerical computing, operations research and system design.</p>
                                <h4>Technical Skills</h4>
                                <p>C, C++, Python, Go, JavaScript, Dart, MATLAB, SQL, React, Next.js, Node.js, Express, FastAPI, Flask, Flutter, fasthttp, scikit-learn, Prisma, LangChain, LangGraph, pandas, NumPy, GCP, Docker, Firebase, Firestore, SQLite, Linux, REST APIs, RAG, DSA, DBMS, OOP, computer networks, operating systems, multithreading and circuit breakers.</p>
                                <h4>Achievements and Leadership</h4>
                                <ul>{ACHIEVEMENTS.map((item) => <li key={item}>{item}</li>)}</ul>
                                <p>Campus roles include Junior-Year Student Representative on the Mechanical Engineering DAPC, Web Developer for the Student Technical Council, Sub-Coordinator of the Trading &amp; Investment Club Market Division, and sponsorship and marketing contributions to E-Cell IIT Patna.</p>
                            </section>
                        )}
                        {currentRoom === 'gallery' && (
                            <section aria-label="Projects">
                                <h3>Selected Projects</h3>
                                <ul>{PROJECTS.map((project) => (
                                    <li key={project.title}>
                                        <h4>{project.title}</h4>
                                        <p>{project.description}</p>
                                        <a href={project.url} target="_blank" rel="noreferrer">View {project.title}</a>
                                    </li>
                                ))}</ul>
                            </section>
                        )}
                        {currentRoom === 'contact' && (
                            <section aria-label="Contact">
                                <h3>Contact Paarth</h3>
                                <p>Email: <a href="mailto:paarthmandelia1@gmail.com">paarthmandelia1@gmail.com</a></p>
                                <p><a href="https://www.linkedin.com/in/paarth-mandelia/" target="_blank" rel="noreferrer">LinkedIn</a></p>
                                <p><a href="https://github.com/paarthM007" target="_blank" rel="noreferrer">GitHub</a></p>
                            </section>
                        )}
                        <h3>Quick Navigation</h3>
                        <ul>
                            {currentRoom !== 'about' && <li><button onClick={() => teleportTo('about')} type="button">Go to About</button></li>}
                            {currentRoom !== 'gallery' && <li><button onClick={() => teleportTo('gallery')} type="button">Go to Projects</button></li>}
                            {currentRoom !== 'contact' && <li><button onClick={() => teleportTo('contact')} type="button">Go to Contact</button></li>}
                        </ul>
                    </>
                )}
            </nav>
            <div aria-live="polite" aria-atomic="true" className="sr-only">{isInRoom && `Entered ${currentRoom} room`}</div>
        </div>
    );
};

export default ScreenReaderOverlay;
