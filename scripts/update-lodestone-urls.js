#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ファイルパス
const htmlPath = path.join(__dirname, '..', '1.html');
const dyesJsonPath = path.join(__dirname, '..', 'static', 'data', 'dyes.json');

// HTMLファイルを読み込み
const html = fs.readFileSync(htmlPath, 'utf-8');

// カララントのURLとname属性を抽出（正規表現）
const regex = /<a href="(\/lodestone\/playguide\/db\/item\/[^"]+)" class="db_popup db-table__txt--detail_link">カララント:([^<]+)<\/a>/g;
const matches = [];
let match;

while ((match = regex.exec(html)) !== null) {
  const url = `https://jp.finalfantasyxiv.com${match[1]}`;
  const name = match[2];
  matches.push({ name, url });
}

console.log(`抽出されたカララント数: ${matches.length}`);

// dyes.jsonを読み込み
const dyesData = JSON.parse(fs.readFileSync(dyesJsonPath, 'utf-8'));

// 名前でマッピング
let updatedCount = 0;
const unmatchedDyes = [];
const unmatchedUrls = [];

dyesData.dyes.forEach(dye => {
  const match = matches.find(m => m.name === dye.name);
  if (match) {
    dye.lodestone = match.url;
    updatedCount++;
  } else {
    unmatchedDyes.push(dye.name);
  }
});

// マッチしなかったURLを確認
matches.forEach(m => {
  if (!dyesData.dyes.find(d => d.name === m.name)) {
    unmatchedUrls.push(m);
  }
});

// 結果をログ出力
console.log(`更新されたカララント数: ${updatedCount}/${dyesData.dyes.length}`);

if (unmatchedDyes.length > 0) {
  console.log('\n[警告] JSONに存在するが、HTMLで見つからなかったカララント:');
  unmatchedDyes.forEach(name => console.log(`  - ${name}`));
}

if (unmatchedUrls.length > 0) {
  console.log('\n[情報] HTMLに存在するが、JSONで見つからなかったカララント:');
  unmatchedUrls.forEach(m => console.log(`  - ${m.name}: ${m.url}`));
}

// dyes.jsonを更新
fs.writeFileSync(dyesJsonPath, JSON.stringify(dyesData, null, 2));
console.log('\n✅ dyes.jsonを更新しました');