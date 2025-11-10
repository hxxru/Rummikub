/**
 * Test AI variants against each other
 */

import { UltraAI } from '../src/js/ai/UltraAI.js';
import { UltraAI_V2 } from '../src/js/ai/UltraAI_V2.js';
import { UltraAI_V3 } from '../src/js/ai/UltraAI_V3.js';
import { runHeadToHead } from './headToHead.js';

async function main() {
    console.log('\n🎮 AI VARIANT TOURNAMENT - ITERATION 1\n');
    console.log('Testing improved variants against baseline UltraAI');
    console.log('Each matchup: 50 games\n');

    const numGames = 50;

    // Test V2 (Aggressive) vs Original
    console.log('\n' + '='.repeat(70));
    console.log('ROUND 1: UltraAI V2 (Aggressive) vs UltraAI (Baseline)');
    console.log('='.repeat(70));
    const v2Results = await runHeadToHead(
        UltraAI_V2,
        UltraAI,
        numGames,
        'UltraAI V2 (Aggressive)',
        'UltraAI (Baseline)'
    );

    // Test V3 (Smart Rebuild) vs Original
    console.log('\n' + '='.repeat(70));
    console.log('ROUND 2: UltraAI V3 (Smart Rebuild) vs UltraAI (Baseline)');
    console.log('='.repeat(70));
    const v3Results = await runHeadToHead(
        UltraAI_V3,
        UltraAI,
        numGames,
        'UltraAI V3 (Smart Rebuild)',
        'UltraAI (Baseline)'
    );

    // Test V2 vs V3
    console.log('\n' + '='.repeat(70));
    console.log('ROUND 3: UltraAI V2 vs UltraAI V3');
    console.log('='.repeat(70));
    const v2v3Results = await runHeadToHead(
        UltraAI_V2,
        UltraAI_V3,
        numGames,
        'UltraAI V2 (Aggressive)',
        'UltraAI V3 (Smart Rebuild)'
    );

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 ITERATION 1 SUMMARY');
    console.log('='.repeat(70));

    console.log('\n1. UltraAI V2 (Aggressive) vs UltraAI (Baseline):');
    console.log(`   V2 wins: ${v2Results.ai1Wins} | Baseline wins: ${v2Results.ai2Wins} | Draws: ${v2Results.draws}`);
    console.log(`   Decisive rate: ${(v2Results.decisiveRate * 100).toFixed(1)}%`);
    console.log(`   V2 win rate: ${(v2Results.ai1Wins / (v2Results.ai1Wins + v2Results.ai2Wins) * 100).toFixed(1)}%`);

    console.log('\n2. UltraAI V3 (Smart Rebuild) vs UltraAI (Baseline):');
    console.log(`   V3 wins: ${v3Results.ai1Wins} | Baseline wins: ${v3Results.ai2Wins} | Draws: ${v3Results.draws}`);
    console.log(`   Decisive rate: ${(v3Results.decisiveRate * 100).toFixed(1)}%`);
    console.log(`   V3 win rate: ${(v3Results.ai1Wins / (v3Results.ai1Wins + v3Results.ai2Wins) * 100).toFixed(1)}%`);

    console.log('\n3. UltraAI V2 vs UltraAI V3:');
    console.log(`   V2 wins: ${v2v3Results.ai1Wins} | V3 wins: ${v2v3Results.ai2Wins} | Draws: ${v2v3Results.draws}`);
    console.log(`   Decisive rate: ${(v2v3Results.decisiveRate * 100).toFixed(1)}%`);

    // Determine best performer
    console.log('\n' + '='.repeat(70));
    console.log('🏆 BEST PERFORMER ANALYSIS');
    console.log('='.repeat(70));

    const v2WinRate = v2Results.ai1Wins / (v2Results.ai1Wins + v2Results.ai2Wins);
    const v3WinRate = v3Results.ai1Wins / (v3Results.ai1Wins + v3Results.ai2Wins);

    if (v2WinRate > 0.55) {
        console.log('✅ UltraAI V2 (Aggressive) shows improvement over baseline!');
        console.log(`   Win rate: ${(v2WinRate * 100).toFixed(1)}% (target: >55%)`);
    } else {
        console.log('❌ UltraAI V2 did not beat baseline significantly');
    }

    if (v3WinRate > 0.55) {
        console.log('✅ UltraAI V3 (Smart Rebuild) shows improvement over baseline!');
        console.log(`   Win rate: ${(v3WinRate * 100).toFixed(1)}% (target: >55%)`);
    } else {
        console.log('❌ UltraAI V3 did not beat baseline significantly');
    }

    if (v2WinRate > v3WinRate && v2WinRate > 0.55) {
        console.log('\n🎯 RECOMMENDATION: UltraAI V2 (Aggressive) is the best variant');
        console.log('   Use V2 as basis for next iteration');
    } else if (v3WinRate > v2WinRate && v3WinRate > 0.55) {
        console.log('\n🎯 RECOMMENDATION: UltraAI V3 (Smart Rebuild) is the best variant');
        console.log('   Use V3 as basis for next iteration');
    } else {
        console.log('\n🎯 RECOMMENDATION: Original UltraAI still best');
        console.log('   Try different improvements in next iteration');
    }

    console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
