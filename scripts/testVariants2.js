/**
 * Test AI variants - Iteration 2
 * Test improved variants based on V3
 */

import { UltraAI } from '../src/js/ai/UltraAI.js';
import { UltraAI_V3 } from '../src/js/ai/UltraAI_V3.js';
import { UltraAI_V4 } from '../src/js/ai/UltraAI_V4.js';
import { runHeadToHead } from './headToHead.js';

async function main() {
    console.log('\n🎮 AI VARIANT TOURNAMENT - ITERATION 2\n');
    console.log('Testing V4 (Hybrid Smart+Aggressive) against winners from iteration 1');
    console.log('Each matchup: 50 games\n');

    const numGames = 50;

    // Test V4 vs V3 (winner from iteration 1)
    console.log('\n' + '='.repeat(70));
    console.log('ROUND 1: UltraAI V4 (Hybrid) vs UltraAI V3 (Iteration 1 Winner)');
    console.log('='.repeat(70));
    const v4v3Results = await runHeadToHead(
        UltraAI_V4,
        UltraAI_V3,
        numGames,
        'UltraAI V4 (Hybrid)',
        'UltraAI V3 (Smart Rebuild)'
    );

    // Test V4 vs Original
    console.log('\n' + '='.repeat(70));
    console.log('ROUND 2: UltraAI V4 (Hybrid) vs UltraAI (Original)');
    console.log('='.repeat(70));
    const v4OriginalResults = await runHeadToHead(
        UltraAI_V4,
        UltraAI,
        numGames,
        'UltraAI V4 (Hybrid)',
        'UltraAI (Original)'
    );

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 ITERATION 2 SUMMARY');
    console.log('='.repeat(70));

    console.log('\n1. UltraAI V4 (Hybrid) vs UltraAI V3:');
    console.log(`   V4 wins: ${v4v3Results.ai1Wins} | V3 wins: ${v4v3Results.ai2Wins} | Draws: ${v4v3Results.draws}`);
    console.log(`   Decisive rate: ${(v4v3Results.decisiveRate * 100).toFixed(1)}%`);
    const v4v3WinRate = v4v3Results.ai1Wins / (v4v3Results.ai1Wins + v4v3Results.ai2Wins);
    console.log(`   V4 win rate: ${(v4v3WinRate * 100).toFixed(1)}%`);

    console.log('\n2. UltraAI V4 (Hybrid) vs UltraAI (Original):');
    console.log(`   V4 wins: ${v4OriginalResults.ai1Wins} | Original wins: ${v4OriginalResults.ai2Wins} | Draws: ${v4OriginalResults.draws}`);
    console.log(`   Decisive rate: ${(v4OriginalResults.decisiveRate * 100).toFixed(1)}%`);
    const v4OriginalWinRate = v4OriginalResults.ai1Wins / (v4OriginalResults.ai1Wins + v4OriginalResults.ai2Wins);
    console.log(`   V4 win rate: ${(v4OriginalWinRate * 100).toFixed(1)}%`);

    // Determine best performer
    console.log('\n' + '='.repeat(70));
    console.log('🏆 ITERATION 2 ANALYSIS');
    console.log('='.repeat(70));

    console.log('\n📈 Win Rate Summary:');
    console.log(`   V4 vs V3: ${(v4v3WinRate * 100).toFixed(1)}%`);
    console.log(`   V4 vs Original: ${(v4OriginalWinRate * 100).toFixed(1)}%`);
    console.log(`   V3 vs Original (from iteration 1): 61.1%`);

    if (v4v3WinRate > 0.55 && v4OriginalWinRate > 0.55) {
        console.log('\n✅ UltraAI V4 (Hybrid) beats both V3 and Original!');
        console.log('   🎯 NEW CHAMPION: UltraAI V4');
        console.log('\n   Key improvements:');
        console.log('   - Smart rebuild conditions from V3');
        console.log('   - Aggressive tile maximization from V2');
        console.log('   - Evaluates multiple strategies and picks best');
    } else if (v4v3WinRate > 0.45) {
        console.log('\n📊 UltraAI V4 competitive but not significantly better');
        console.log('   V3 remains strong contender');
    } else {
        console.log('\n❌ UltraAI V4 did not improve over V3');
        console.log('   🎯 CHAMPION: UltraAI V3 (Smart Rebuild)');
    }

    console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
