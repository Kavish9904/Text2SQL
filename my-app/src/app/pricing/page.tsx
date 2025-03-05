"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PricingPage() {
  const [planType, setPlanType] = useState<"personal" | "business">("personal");

  const personalPlans = [
    {
      name: "Free",
      price: "0",
      description:
        "Basic SQL generation for individuals. Perfect for getting started.",
      features: [
        "Basic SQL query generation",
        "Standard response time",
        "Community support access",
        "Basic data visualization",
        "Limited history retention",
        "Single database connection",
      ],
      cta: "Your current plan",
      ctaDisabled: true,
    },
    {
      name: "Plus",
      price: "20",
      popular: true,
      description:
        "Advanced features for power users. Optimize your SQL workflow.",
      features: [
        "Everything in Free",
        "Advanced query optimization",
        "Priority response time",
        "Multiple database connections",
        "Extended history retention",
        "Custom templates",
        "Priority email support",
        "Early access to features",
      ],
      cta: "Get Plus",
    },
    {
      name: "Pro",
      price: "200",
      description:
        "Maximum power for professionals. Unlimited SQL capabilities.",
      features: [
        "Everything in Plus",
        "Unlimited query generation",
        "Custom model fine-tuning",
        "Advanced analytics",
        "24/7 premium support",
        "API access",
      ],
      cta: "Get Pro",
    },
  ];

  const businessPlan = {
    name: "Team",
    price: "25",
    description:
      "Empower your team with advanced SQL generation and collaboration.",
    features: [
      "Unlimited SQL query generation for all team members",
      "Advanced query optimization and performance tuning",
      "Collaborative workspaces for sharing and editing queries",
      "Integration with popular database management systems",
      "Custom AI model training for your specific database schema",
      "Priority support with dedicated account manager",
      "Advanced analytics and team usage reports",
      "API access for seamless integration with your tools",
      "Enhanced data security and compliance features",
      "Regular feature updates and early access to new capabilities",
    ],
    cta: "Get Team",
    footnote: "For 3+ users, billed annually",
  };

  const renderCheckIcon = () => (
    <span className="h-5 w-5 text-green-500 shrink-0 mr-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-12">
          <div className="space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
              Upgrade your plan
            </h1>
            <p className="text-black text-base sm:text-lg">
              Choose the perfect plan for your needs. Upgrade or downgrade at
              any time.
            </p>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-full bg-gray-100 p-1 text-sm">
              <button
                onClick={() => setPlanType("personal")}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  planType === "personal"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setPlanType("business")}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  planType === "business"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Business
              </button>
            </div>
          </div>

          {planType === "personal" ? (
            <div className="grid md:grid-cols-3 gap-6">
              {personalPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className="relative bg-white border-gray-200 shadow-sm p-6"
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                      <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-black">
                      {plan.name}
                    </h2>
                    <div className="flex items-baseline mb-4">
                      <span className="text-sm text-black">$</span>
                      <span className="text-5xl font-bold text-black">
                        {plan.price}
                      </span>
                      <span className="text-black ml-2">USD/month</span>
                    </div>
                    <p className="text-black text-sm h-10 overflow-hidden">
                      {plan.description}
                    </p>
                  </div>

                  <Button
                    className={`w-full mb-8 ${
                      plan.popular
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : plan.name === "Pro"
                        ? "bg-gray-800 text-white hover:bg-gray-900"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                    disabled={plan.ctaDisabled}
                  >
                    {plan.cta}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex text-sm">
                        {renderCheckIcon()}
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <Card className="bg-white border-gray-200 shadow-sm p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-black">
                    {businessPlan.name}
                  </h2>
                  <div className="flex items-baseline mb-4">
                    <span className="text-sm text-black">$</span>
                    <span className="text-5xl font-bold text-black">
                      {businessPlan.price}
                    </span>
                    <span className="text-black ml-2">USD/user/month</span>
                  </div>
                  <p className="text-black text-sm h-10 overflow-hidden">
                    {businessPlan.description}
                  </p>

                  <Button className="w-full mb-8 bg-blue-500 text-white hover:bg-blue-600">
                    {businessPlan.cta}
                  </Button>

                  <ul className="space-y-4">
                    {businessPlan.features.map((feature, index) => (
                      <li key={index} className="flex text-sm">
                        {renderCheckIcon()}
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm text-gray-500 mt-6">
                    {businessPlan.footnote}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
