/**
 * Final comprehensive tournament
 * Test top 3 variants with 100 games each for reliable statistics
 */

import { UltraAI } from '../src/js/ai/UltraAI.js';
import { UltraAI_V3 } from '../src/js/ai/UltraAI_V3.js';
import { UltraAI_V4 } from '../src/js/ai/UltraAI_V4.js';
import { runHeadToHead } from './headToHead.js';

async function main() {
    console.log('\n🏆 FINAL AI TOURNAMENT - 100 GAMES EACH\n');
    console.log('Testing top variants with larger sample size for reliable statistics');
    console.log('='.repeat(70));

    const numGames = 100;

    // Test all combinations
    console.log('\n📊 ROUND 1: Original vs V3');
    const originalV3 = await runHeadToHead(
        UltraAI,
        UltraAI_V3,
        numGames,
        'UltraAI (Original)',
        'UltraAI V3 (Smart Rebuild)'
    );

    console.log('\n📊 ROUND 2: Original vs V4');
    const originalV4 = await runHeadToHead(
        UltraAI,
        UltraAI_V4,
        numGames,
        'UltraAI (Original)',
        'UltraAI V4 (Hybrid)'
    );

    console.log('\n📊 ROUND 3: V3 vs V4');
    const v3V4 = await runHeadToHead(
        UltraAI_V3,
        UltraAI_V4,
        numGames,
        'UltraAI V3 (Smart Rebuild)',
        'UltraAI V4 (Hybrid)'
    );

    // Calculate comprehensive statistics
    console.log('\n' + '='.repeat(70));
    console.log('🏆 FINAL TOURNAMENT RESULTS');
    console.log('='.repeat(70));

    // Calculate scores (2 points for win, 1 for draw, 0 for loss)
    const scores = {
        Original: 0,
        V3: 0,
        V4: 0
    };

    // Original vs V3
    scores.Original += originalV3.ai1Wins * 2 + originalV3.draws;
    scores.V3 += originalV3.ai2Wins * 2 + originalV3.draws;

    // Original vs V4
    scores.Original += originalV4.ai1Wins * 2 + originalV4.draws;
    scores.V4 += originalV4.ai2Wins * 2 + originalV4.draws;

    // V3 vs V4
    scores.V3 += v3V4.ai1Wins * 2 + v3V4.draws;
    scores.V4 += v3V4.ai2Wins * 2 + v3V4.draws;

    console.log('\n📈 HEAD-TO-HEAD RECORDS:');
    console.log('\nOriginal vs V3:');
    console.log(`   Original: ${originalV3.ai1Wins}W-${originalV3.ai2Wins}L-${originalV3.draws}D`);
    console.log(`   V3: ${originalV3.ai2Wins}W-${originalV3.ai1Wins}L-${originalV3.draws}D`);
    console.log(`   V3 win rate: ${(originalV3.ai2Wins / (originalV3.ai1Wins + originalV3.ai2Wins) * 100).toFixed(1)}%`);
    console.log(`   Decisive: ${(originalV3.decisiveRate * 100).toFixed(1)}%`);

    console.log('\nOriginal vs V4:');
    console.log(`   Original: ${originalV4.ai1Wins}W-${originalV4.ai2Wins}L-${originalV4.draws}D`);
    console.log(`   V4: ${originalV4.ai2Wins}W-${originalV4.ai1Wins}L-${originalV4.draws}D`);
    console.log(`   V4 win rate: ${(originalV4.ai2Wins / (originalV4.ai1Wins + originalV4.ai2Wins) * 100).toFixed(1)}%`);
    console.log(`   Decisive: ${(originalV4.decisiveRate * 100).toFixed(1)}%`);

    console.log('\nV3 vs V4:');
    console.log(`   V3: ${v3V4.ai1Wins}W-${v3V4.ai2Wins}L-${v3V4.draws}D`);
    console.log(`   V4: ${v3V4.ai2Wins}W-${v3V4.ai1Wins}L-${v3V4.draws}D`);
    console.log(`   V4 win rate: ${(v3V4.ai2Wins / (v3V4.ai1Wins + v3V4.ai2Wins) * 100).toFixed(1)}%`);
    console.log(`   Decisive: ${(v3V4.decisiveRate * 100).toFixed(1)}%`);

    console.log('\n📊 TOURNAMENT STANDINGS (points: 2W + 1D):');
    const standings = [
        { name: 'UltraAI (Original)', score: scores.Original },
        { name: 'UltraAI V3 (Smart Rebuild)', score: scores.V3 },
        { name: 'UltraAI V4 (Hybrid)', score: scores.V4 }
    ].sort((a, b) => b.score - a.score);

    standings.forEach((ai, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        console.log(`   ${medal} ${ai.name}: ${ai.score} points`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('🎯 FINAL RECOMMENDATION');
    console.log('='.repeat(70));

    const winner = standings[0];
    console.log(`\n🏆 CHAMPION: ${winner.name}`);
    console.log(`   Total score: ${winner.score}/400 possible points`);

    // Calculate win rates
    const originalWins = originalV3.ai1Wins + originalV4.ai1Wins;
    const originalGames = originalV3.ai1Wins + originalV3.ai2Wins + originalV4.ai1Wins + originalV4.ai2Wins;
    const v3Wins = originalV3.ai2Wins + v3V4.ai1Wins;
    const v3Games = originalV3.ai1Wins + originalV3.ai2Wins + v3V4.ai1Wins + v3V4.ai2Wins;
    const v4Wins = originalV4.ai2Wins + v3V4.ai2Wins;
    const v4Games = originalV4.ai1Wins + originalV4.ai2Wins + v3V4.ai1Wins + v3V4.ai2Wins;

    console.log('\n📈 Overall Win Rates (decisive games only):');
    console.log(`   Original: ${originalWins}/${originalGames} = ${(originalWins/originalGames*100).toFixed(1)}%`);
    console.log(`   V3: ${v3Wins}/${v3Games} = ${(v3Wins/v3Games*100).toFixed(1)}%`);
    console.log(`   V4: ${v4Wins}/${v4Games} = ${(v4Wins/v4Games*100).toFixed(1)}%`);

    // Determine if we beat original significantly
    console.log('\n🎯 Improvement Analysis:');
    if (winner.name.includes('V3')) {
        const improvement = ((v3Wins/v3Games) / (originalWins/originalGames) - 1) * 100;
        console.log(`   ✅ V3 improved win rate by ${improvement.toFixed(1)}% over original`);
        console.log('\n   Key V3 features:');
        console.log('   - Smart conditional rebuild (only when favorable)');
        console.log('   - Efficient strategy ordering');
        console.log('   - Balanced approach');
    } else if (winner.name.includes('V4')) {
        const improvement = ((v4Wins/v4Games) / (originalWins/originalGames) - 1) * 100;
        console.log(`   ✅ V4 improved win rate by ${improvement.toFixed(1)}% over original`);
        console.log('\n   Key V4 features:');
        console.log('   - Hybrid smart rebuild + aggressive play');
        console.log('   - Maximizes tiles played per turn');
        console.log('   - Evaluates multiple strategies');
    } else {
        console.log('   📊 Original UltraAI remains competitive');
        console.log('   Variants showed improvement in specific matchups but not overall');
    }

    console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
