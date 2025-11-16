#!/usr/bin/env node

/**
 * Agent 16 Example: Competitor Intelligence System
 * 
 * This example demonstrates how to use Agent 16 to:
 * 1. Run immediate competitor research
 * 2. Schedule weekly automated research
 * 3. Detect and report changes
 * 
 * Usage:
 *   node examples/agent16-example.js
 */

const { ResearchScheduler } = require('../dist/services/researchScheduler');
const { CompetitorResearchOrchestrator } = require('../dist/services/competitorResearch');

async function runImmediateResearchExample() {
  console.log('\n🔬 Example 1: Run Immediate Research\n');
  console.log('This example shows how to research a competitor immediately.\n');

  console.log('ℹ️  Note: This is a demonstration with simulated data.');
  console.log('   To scrape real websites, install Playwright browsers with:');
  console.log('   npx playwright install chromium\n');

  // Demonstrate without actually launching browser
  const orchestrator = new CompetitorResearchOrchestrator();
  
  try {
    // Skip browser initialization for demo
    // await orchestrator.initialize();
    console.log('✅ Demo mode (browser not initialized)');

    // Example: Research a hypothetical competitor
    // In production, replace with a real competitor website
    console.log('\n📊 Starting research for Example Corp...');
    console.log('   (In this demo, we\'ll simulate the data structure)\n');

    // Simulate a profile (in real usage, this would be scraped)
    const exampleProfile = {
      id: 'comp-example-001',
      company: {
        name: 'Example Corp',
        website: 'https://example.com',
        founded: new Date('2010-01-01'),
        headquarters: {
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA'
        },
        size: {
          employees: 250,
          employeesGrowthRate: 15,
          estimatedRevenue: 50000000,
          revenueGrowthRate: 25
        },
        legal: {
          type: 'Private'
        }
      },
      marketPosition: {
        marketShare: 5.2,
        ranking: 12,
        category: 'SaaS',
        subcategories: ['Project Management', 'Collaboration'],
        geographicReach: ['USA', 'Canada', 'UK'],
        targetMarket: {
          b2b: true,
          b2c: false,
          b2g: false,
          segments: ['SMB', 'Enterprise']
        }
      },
      offerings: {
        products: [
          {
            name: 'Project Pro',
            description: 'Advanced project management software',
            launchDate: new Date('2015-06-01'),
            pricing: {
              model: 'Subscription',
              tiers: [
                {
                  name: 'Basic',
                  price: 29,
                  currency: 'USD',
                  billingCycle: 'Monthly',
                  features: ['5 projects', '10 users', 'Basic support']
                },
                {
                  name: 'Pro',
                  price: 79,
                  currency: 'USD',
                  billingCycle: 'Monthly',
                  features: ['Unlimited projects', '50 users', 'Priority support', 'Advanced analytics']
                }
              ]
            },
            targetAudience: 'Small to medium businesses',
            competitiveAdvantage: ['Easy to use', 'Affordable pricing', 'Great support']
          }
        ],
        services: []
      },
      pricing: {
        strategy: 'Value',
        pricePoints: [
          {
            product: 'Basic',
            price: 29,
            currency: 'USD',
            lastUpdated: new Date(),
            historicalPrices: []
          },
          {
            product: 'Pro',
            price: 79,
            currency: 'USD',
            lastUpdated: new Date(),
            historicalPrices: []
          }
        ],
        discounts: {
          seasonal: [],
          volumeBased: []
        }
      },
      technology: {
        frontend: ['React', 'TypeScript'],
        backend: ['Node.js', 'PostgreSQL'],
        infrastructure: ['AWS', 'CloudFront'],
        security: ['SSL', 'OAuth2'],
        integrations: ['Slack', 'Google Drive', 'Dropbox']
      },
      marketing: {
        channels: {
          organic: {
            seo: {
              domainAuthority: 65,
              organicTraffic: 150000,
              topKeywords: [
                { keyword: 'project management', position: 15, volume: 50000 },
                { keyword: 'team collaboration', position: 8, volume: 30000 }
              ]
            }
          },
          paid: {
            googleAds: {
              active: true,
              estimatedSpend: 50000
            }
          },
          social: {
            platforms: [
              { platform: 'LinkedIn', handle: '@examplecorp', followers: 25000, engagementRate: 3.5 },
              { platform: 'Twitter', handle: '@examplecorp', followers: 15000, engagementRate: 2.1 }
            ]
          }
        },
        messaging: {
          valueProposition: 'Simple, powerful project management for growing teams',
          tagline: 'Work smarter, not harder',
          keyMessages: ['Easy to use', 'Affordable', 'Great support']
        }
      },
      customers: {
        totalCustomers: 5000,
        notableClients: [
          { name: 'Tech Startup A', industry: 'Technology', publiclyAnnounced: true },
          { name: 'Consulting Firm B', industry: 'Professional Services', publiclyAnnounced: true }
        ],
        customerRetention: 92,
        nps: 55
      },
      reputation: {
        reviews: {
          g2: { rating: 4.5, reviewCount: 230, url: 'https://g2.com/example' },
          capterra: { rating: 4.3, reviewCount: 180, url: 'https://capterra.com/example' },
          trustpilot: { rating: 4.4, reviewCount: 95, url: 'https://trustpilot.com/example' }
        },
        sentiment: {
          overall: 'Positive',
          strengths: ['Easy to use', 'Great support', 'Reliable'],
          weaknesses: ['Limited integrations', 'Pricing']
        }
      },
      leadership: {
        executives: [
          {
            name: 'Jane Doe',
            title: 'CEO',
            background: 'Former VP at BigTech, 15 years experience',
            linkedin: 'https://linkedin.com/in/janedoe'
          },
          {
            name: 'John Smith',
            title: 'CTO',
            background: 'Ex-Google engineer, 10 years experience',
            linkedin: 'https://linkedin.com/in/johnsmith'
          }
        ]
      },
      financials: {
        funding: {
          totalRaised: 25000000,
          lastRound: {
            type: 'Series B',
            amount: 15000000,
            date: new Date('2022-06-15'),
            valuation: 100000000
          }
        }
      },
      recentActivity: [
        {
          date: new Date('2024-10-01'),
          type: 'Product Launch',
          description: 'Launched mobile app for iOS and Android',
          impact: 'High',
          source: 'Company blog'
        },
        {
          date: new Date('2024-09-15'),
          type: 'Partnership',
          description: 'Partnership with Microsoft Teams',
          impact: 'Medium',
          source: 'Press release'
        }
      ],
      metadata: {
        lastUpdated: new Date(),
        dataQuality: {
          completeness: 85,
          accuracy: 90,
          sources: ['website_scraping', 'review_aggregation', 'manual_input']
        },
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    };

    console.log('✅ Research complete!');
    console.log(`\n📊 Profile Summary for ${exampleProfile.company.name}:`);
    console.log(`   • Founded: ${exampleProfile.company.founded?.getFullYear()}`);
    console.log(`   • Employees: ${exampleProfile.company.size.employees}`);
    console.log(`   • Products: ${exampleProfile.offerings.products.length}`);
    console.log(`   • Pricing Strategy: ${exampleProfile.pricing.strategy}`);
    console.log(`   • G2 Rating: ${exampleProfile.reputation.reviews.g2.rating}/5.0`);
    console.log(`   • Data Completeness: ${exampleProfile.metadata.dataQuality.completeness}%`);
    console.log(`   • Data Accuracy: ${exampleProfile.metadata.dataQuality.accuracy}%\n`);

    // Skip cleanup for demo
    // await orchestrator.cleanup();
    console.log('✅ Demo complete');

  } catch (error) {
    console.error('❌ Error during research:', error.message);
  }
}

async function scheduledResearchExample() {
  console.log('\n🔬 Example 2: Scheduled Research\n');
  console.log('This example shows how to schedule weekly competitor research.\n');

  console.log('ℹ️  Note: This is a demonstration with simulated data.');
  console.log('   To schedule real research, ensure Playwright is installed.\n');

  const scheduler = new ResearchScheduler();

  try {
    // Skip initialization for demo
    // await scheduler.initialize();
    console.log('✅ Demo mode (scheduler not initialized)');

    // Configure competitors to research
    const competitors = [
      {
        name: 'Competitor A',
        website: 'https://competitor-a.com',
        schedule: '0 2 * * 1' // Monday 2 AM
      },
      {
        name: 'Competitor B',
        website: 'https://competitor-b.com',
        schedule: '0 3 * * 1' // Monday 3 AM
      }
    ];

    console.log('\n📅 Scheduling research for competitors:');
    competitors.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.schedule} (${parseCron(comp.schedule)})`);
    });

    // In production, you would call:
    // scheduler.scheduleWeeklyResearch(competitors);
    
    console.log('\n✅ Research scheduled (demo mode - not actually scheduled)');
    console.log('   In production, research would run automatically on schedule.');

    // Skip cleanup for demo
    // await scheduler.cleanup();
    console.log('✅ Demo complete');

  } catch (error) {
    console.error('❌ Error during scheduling:', error.message);
  }
}

function parseCron(cronExpression) {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return cronExpression;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayOfWeek !== '*' ? days[parseInt(dayOfWeek)] : 'Every day';
  
  return `${dayName} at ${hour}:${minute.padStart(2, '0')}`;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Agent 16: Competitor Intelligence & Research Specialist  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    // Example 1: Immediate Research
    await runImmediateResearchExample();

    // Example 2: Scheduled Research
    await scheduledResearchExample();

    console.log('\n✅ All examples completed successfully!\n');
    console.log('📚 For more information, see README-competitor-research.md');

  } catch (error) {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  }
}

// Run examples
if (require.main === module) {
  main();
}

module.exports = { runImmediateResearchExample, scheduledResearchExample };
