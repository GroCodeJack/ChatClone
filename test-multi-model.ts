/**
 * Test script for multi-model implementation
 * Tests OpenAI and Anthropic model integration
 * 
 * Run with: npx tsx test-multi-model.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, ".env.local") });

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const TEST_PROMPT = "Say 'Hello from' followed by your model name in exactly 5 words.";

async function testOpenAI() {
  console.log("\n🔵 Testing OpenAI GPT-4o...");
  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: TEST_PROMPT,
    });
    console.log("✅ OpenAI Response:", result.text);
    return true;
  } catch (error) {
    console.error("❌ OpenAI Error:", error);
    return false;
  }
}

async function testOpenAIMini() {
  console.log("\n🔵 Testing OpenAI GPT-4o-mini...");
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: TEST_PROMPT,
    });
    console.log("✅ OpenAI Mini Response:", result.text);
    return true;
  } catch (error) {
    console.error("❌ OpenAI Mini Error:", error);
    return false;
  }
}

async function testAnthropic() {
  console.log("\n🟣 Testing Anthropic Claude Haiku 4.5...");
  try {
    const result = await generateText({
      model: anthropic("claude-3-5-haiku-20241022"),
      prompt: TEST_PROMPT,
    });
    console.log("✅ Anthropic Response:", result.text);
    return true;
  } catch (error) {
    console.error("❌ Anthropic Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return false;
  }
}

async function testModelConfig() {
  console.log("\n⚙️  Testing Model Configuration...");
  try {
    const { AVAILABLE_MODELS, getModelById, getDefaultModel } = await import("./src/lib/models/config");
    
    console.log(`✅ Found ${AVAILABLE_MODELS.length} models configured:`);
    AVAILABLE_MODELS.forEach(model => {
      console.log(`   - ${model.name} (${model.id}) - ${model.provider}`);
    });
    
    const defaultModel = getDefaultModel();
    console.log(`✅ Default model: ${defaultModel.name}`);
    
    const haikuModel = getModelById("haiku-4-5");
    if (haikuModel) {
      console.log(`✅ Haiku model found: ${haikuModel.name}`);
    } else {
      console.log("❌ Haiku model not found in config");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Config Error:", error);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log("\n🔐 Checking Environment Variables...");
  
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (openaiKey) {
    console.log(`✅ OPENAI_API_KEY is set (${openaiKey.substring(0, 10)}...)`);
  } else {
    console.log("❌ OPENAI_API_KEY is not set");
  }
  
  if (anthropicKey) {
    console.log(`✅ ANTHROPIC_API_KEY is set (${anthropicKey.substring(0, 10)}...)`);
  } else {
    console.log("❌ ANTHROPIC_API_KEY is not set");
  }
  
  return !!(openaiKey && anthropicKey);
}

async function main() {
  console.log("🚀 Multi-Model Implementation Test\n");
  console.log("=" .repeat(50));
  
  const results = {
    envVars: await checkEnvironmentVariables(),
    config: await testModelConfig(),
    openai: await testOpenAI(),
    openaiMini: await testOpenAIMini(),
    anthropic: await testAnthropic(),
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Test Results Summary:\n");
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? "✅" : "❌";
    const label = test.replace(/([A-Z])/g, " $1").toUpperCase();
    console.log(`${icon} ${label}: ${passed ? "PASSED" : "FAILED"}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 All tests passed! Multi-model implementation is working.\n");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.\n");
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
