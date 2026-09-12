"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BuyerSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account",       label: "Account"       },
    { id: "notifications", label: "Notifications" },
    { id: "privacy",       label: "Privacy"       },
    { id: "addresses",     label: "Addresses"     },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Settings</h1>
        <p className="text-sm text-[var(--color-sage)]">Manage your account preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-cream rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-white text-primary shadow-sm"
                : "text-[var(--color-sage)] hover:text-primary-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <Card>
          <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Display Name</label>
              <input
                type="text"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Location</label>
              <input
                type="text"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                placeholder="City, State"
              />
            </div>
            <Button>Save Changes</Button>
          </CardBody>
        </Card>
      )}

      {activeTab === "notifications" && (
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {[
              "Order Updates",
              "New Offers",
              "Price Drops on Wishlist",
              "Community Activity",
              "Promotional Offers",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span className="text-sm text-primary-dark">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeTab === "privacy" && (
        <Card>
          <CardHeader><CardTitle>Privacy Settings</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {[
              "Show profile to sellers",
              "Allow direct messages",
              "Share purchase history for recommendations",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span className="text-sm text-primary-dark">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeTab === "addresses" && (
        <Card>
          <CardHeader><CardTitle>Saved Addresses</CardTitle></CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-[var(--color-sage)] text-sm">No saved addresses yet</p>
              <Button className="mt-3" size="sm">+ Add Address</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
