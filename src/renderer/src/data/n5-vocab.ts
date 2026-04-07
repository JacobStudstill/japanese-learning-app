export interface VocabItem {
  word: string
  reading: string
  meaning: string
  exampleSentence?: string
  exampleReading?: string
  exampleMeaning?: string
  partOfSpeech: string
}

export const n5Vocab: VocabItem[] = [
  // ── Pronouns & Basic Words ─────────────────────────────────────────────────
  { word: '私', reading: 'わたし', meaning: 'I, me', exampleSentence: '私は学生です。', exampleReading: 'わたしはがくせいです。', exampleMeaning: 'I am a student.', partOfSpeech: 'pronoun' },
  { word: 'あなた', reading: 'あなた', meaning: 'you', exampleSentence: 'あなたはどこから来ましたか。', exampleReading: 'あなたはどこからきましたか。', exampleMeaning: 'Where did you come from?', partOfSpeech: 'pronoun' },
  { word: '彼', reading: 'かれ', meaning: 'he, him, boyfriend', exampleSentence: '彼は優しいです。', exampleReading: 'かれはやさしいです。', exampleMeaning: 'He is kind.', partOfSpeech: 'pronoun' },
  { word: '彼女', reading: 'かのじょ', meaning: 'she, her, girlfriend', exampleSentence: '彼女は先生です。', exampleReading: 'かのじょはせんせいです。', exampleMeaning: 'She is a teacher.', partOfSpeech: 'pronoun' },

  // ── Nouns: People ──────────────────────────────────────────────────────────
  { word: '人', reading: 'ひと', meaning: 'person, people', exampleSentence: 'あの人は誰ですか。', exampleReading: 'あのひとはだれですか。', exampleMeaning: 'Who is that person?', partOfSpeech: 'noun' },
  { word: '友達', reading: 'ともだち', meaning: 'friend', exampleSentence: '友達と映画を見ました。', exampleReading: 'ともだちとえいがをみました。', exampleMeaning: 'I watched a movie with my friend.', partOfSpeech: 'noun' },
  { word: '先生', reading: 'せんせい', meaning: 'teacher', exampleSentence: '先生は教室にいます。', exampleReading: 'せんせいはきょうしつにいます。', exampleMeaning: 'The teacher is in the classroom.', partOfSpeech: 'noun' },
  { word: '学生', reading: 'がくせい', meaning: 'student', exampleSentence: '私は大学生です。', exampleReading: 'わたしはだいがくせいです。', exampleMeaning: 'I am a university student.', partOfSpeech: 'noun' },
  { word: '子供', reading: 'こども', meaning: 'child, children', exampleSentence: '子供が公園で遊んでいます。', exampleReading: 'こどもがこうえんであそんでいます。', exampleMeaning: 'Children are playing in the park.', partOfSpeech: 'noun' },

  // ── Nouns: Places ─────────────────────────────────────────────────────────
  { word: '学校', reading: 'がっこう', meaning: 'school', exampleSentence: '学校は九時に始まります。', exampleReading: 'がっこうはくじにはじまります。', exampleMeaning: 'School starts at nine.', partOfSpeech: 'noun' },
  { word: '会社', reading: 'かいしゃ', meaning: 'company, office', exampleSentence: '会社は駅の近くにあります。', exampleReading: 'かいしゃはえきのちかくにあります。', exampleMeaning: 'The company is near the station.', partOfSpeech: 'noun' },
  { word: '家', reading: 'いえ', meaning: 'house, home', exampleSentence: '家に帰りました。', exampleReading: 'いえにかえりました。', exampleMeaning: 'I returned home.', partOfSpeech: 'noun' },
  { word: 'お店', reading: 'おみせ', meaning: 'shop, store', exampleSentence: 'お店でりんごを買いました。', exampleReading: 'おみせでりんごをかいました。', exampleMeaning: 'I bought an apple at the store.', partOfSpeech: 'noun' },
  { word: '駅', reading: 'えき', meaning: 'train station', exampleSentence: '駅まで歩いていきます。', exampleReading: 'えきまであるいていきます。', exampleMeaning: 'I walk to the station.', partOfSpeech: 'noun' },
  { word: '病院', reading: 'びょういん', meaning: 'hospital', exampleSentence: '病院は大きいです。', exampleReading: 'びょういんはおおきいです。', exampleMeaning: 'The hospital is big.', partOfSpeech: 'noun' },
  { word: 'レストラン', reading: 'れすとらん', meaning: 'restaurant', exampleSentence: 'レストランで晩ごはんを食べます。', exampleReading: 'れすとらんでばんごはんをたべます。', exampleMeaning: 'I eat dinner at a restaurant.', partOfSpeech: 'noun' },
  { word: '公園', reading: 'こうえん', meaning: 'park', exampleSentence: '公園で散歩します。', exampleReading: 'こうえんでさんぽします。', exampleMeaning: 'I take a walk in the park.', partOfSpeech: 'noun' },

  // ── Nouns: Transport ──────────────────────────────────────────────────────
  { word: '電車', reading: 'でんしゃ', meaning: 'train (electric)', exampleSentence: '電車で学校に行きます。', exampleReading: 'でんしゃでがっこうにいきます。', exampleMeaning: 'I go to school by train.', partOfSpeech: 'noun' },
  { word: 'バス', reading: 'ばす', meaning: 'bus', exampleSentence: 'バスで来ました。', exampleReading: 'ばすできました。', exampleMeaning: 'I came by bus.', partOfSpeech: 'noun' },
  { word: '車', reading: 'くるま', meaning: 'car', exampleSentence: '車は便利です。', exampleReading: 'くるまはべんりです。', exampleMeaning: 'Cars are convenient.', partOfSpeech: 'noun' },
  { word: '自転車', reading: 'じてんしゃ', meaning: 'bicycle', exampleSentence: '自転車で公園に行きます。', exampleReading: 'じてんしゃでこうえんにいきます。', exampleMeaning: 'I go to the park by bicycle.', partOfSpeech: 'noun' },

  // ── Nouns: Food & Drink ───────────────────────────────────────────────────
  { word: '水', reading: 'みず', meaning: 'water', exampleSentence: '水を一杯ください。', exampleReading: 'みずをいっぱいください。', exampleMeaning: 'Please give me a glass of water.', partOfSpeech: 'noun' },
  { word: 'お茶', reading: 'おちゃ', meaning: 'tea', exampleSentence: 'お茶を飲みます。', exampleReading: 'おちゃをのみます。', exampleMeaning: 'I drink tea.', partOfSpeech: 'noun' },
  { word: 'ご飯', reading: 'ごはん', meaning: 'rice, meal', exampleSentence: 'ご飯を食べましょう。', exampleReading: 'ごはんをたべましょう。', exampleMeaning: 'Let\'s eat a meal.', partOfSpeech: 'noun' },
  { word: '食べ物', reading: 'たべもの', meaning: 'food', exampleSentence: '日本の食べ物が好きです。', exampleReading: 'にほんのたべものがすきです。', exampleMeaning: 'I like Japanese food.', partOfSpeech: 'noun' },
  { word: '肉', reading: 'にく', meaning: 'meat', exampleSentence: '肉が好きですか。', exampleReading: 'にくがすきですか。', exampleMeaning: 'Do you like meat?', partOfSpeech: 'noun' },
  { word: '魚', reading: 'さかな', meaning: 'fish', exampleSentence: '魚を食べます。', exampleReading: 'さかなをたべます。', exampleMeaning: 'I eat fish.', partOfSpeech: 'noun' },
  { word: 'パン', reading: 'ぱん', meaning: 'bread', exampleSentence: '朝パンを食べます。', exampleReading: 'あさぱんをたべます。', exampleMeaning: 'I eat bread in the morning.', partOfSpeech: 'noun' },
  { word: '牛乳', reading: 'ぎゅうにゅう', meaning: 'milk', exampleSentence: '牛乳が好きですか。', exampleReading: 'ぎゅうにゅうがすきですか。', exampleMeaning: 'Do you like milk?', partOfSpeech: 'noun' },

  // ── Nouns: Time ───────────────────────────────────────────────────────────
  { word: '今日', reading: 'きょう', meaning: 'today', exampleSentence: '今日は暑いです。', exampleReading: 'きょうはあついです。', exampleMeaning: 'Today is hot.', partOfSpeech: 'noun' },
  { word: '明日', reading: 'あした', meaning: 'tomorrow', exampleSentence: '明日また来てください。', exampleReading: 'あしたまたきてください。', exampleMeaning: 'Please come again tomorrow.', partOfSpeech: 'noun' },
  { word: '昨日', reading: 'きのう', meaning: 'yesterday', exampleSentence: '昨日は雨でした。', exampleReading: 'きのうはあめでした。', exampleMeaning: 'Yesterday it was raining.', partOfSpeech: 'noun' },
  { word: '今', reading: 'いま', meaning: 'now', exampleSentence: '今何時ですか。', exampleReading: 'いまなんじですか。', exampleMeaning: 'What time is it now?', partOfSpeech: 'noun' },
  { word: '時間', reading: 'じかん', meaning: 'time, hours', exampleSentence: '時間がありません。', exampleReading: 'じかんがありません。', exampleMeaning: 'I don\'t have time.', partOfSpeech: 'noun' },
  { word: '毎日', reading: 'まいにち', meaning: 'every day', exampleSentence: '毎日日本語を勉強します。', exampleReading: 'まいにちにほんごをべんきょうします。', exampleMeaning: 'I study Japanese every day.', partOfSpeech: 'noun' },
  { word: '週末', reading: 'しゅうまつ', meaning: 'weekend', exampleSentence: '週末は何をしますか。', exampleReading: 'しゅうまつはなにをしますか。', exampleMeaning: 'What do you do on weekends?', partOfSpeech: 'noun' },

  // ── Nouns: Money & Things ─────────────────────────────────────────────────
  { word: 'お金', reading: 'おかね', meaning: 'money', exampleSentence: 'お金がありません。', exampleReading: 'おかねがありません。', exampleMeaning: 'I don\'t have money.', partOfSpeech: 'noun' },
  { word: '本', reading: 'ほん', meaning: 'book', exampleSentence: '本を読むのが好きです。', exampleReading: 'ほんをよむのがすきです。', exampleMeaning: 'I like reading books.', partOfSpeech: 'noun' },
  { word: '電話', reading: 'でんわ', meaning: 'telephone', exampleSentence: '電話をかけてください。', exampleReading: 'でんわをかけてください。', exampleMeaning: 'Please call me.', partOfSpeech: 'noun' },
  { word: '写真', reading: 'しゃしん', meaning: 'photograph', exampleSentence: '写真を撮ってもいいですか。', exampleReading: 'しゃしんをとってもいいですか。', exampleMeaning: 'May I take a photo?', partOfSpeech: 'noun' },

  // ── Nouns: Language ───────────────────────────────────────────────────────
  { word: '日本語', reading: 'にほんご', meaning: 'Japanese language', exampleSentence: '日本語を勉強しています。', exampleReading: 'にほんごをべんきょうしています。', exampleMeaning: 'I am studying Japanese.', partOfSpeech: 'noun' },
  { word: '英語', reading: 'えいご', meaning: 'English language', exampleSentence: '英語が話せますか。', exampleReading: 'えいごがはなせますか。', exampleMeaning: 'Can you speak English?', partOfSpeech: 'noun' },
  { word: '言葉', reading: 'ことば', meaning: 'word, language', exampleSentence: '新しい言葉を覚えました。', exampleReading: 'あたらしいことばをおぼえました。', exampleMeaning: 'I learned a new word.', partOfSpeech: 'noun' },

  // ── Verbs ─────────────────────────────────────────────────────────────────
  { word: '食べる', reading: 'たべる', meaning: 'to eat', exampleSentence: 'すしを食べたいです。', exampleReading: 'すしをたべたいです。', exampleMeaning: 'I want to eat sushi.', partOfSpeech: 'verb' },
  { word: '飲む', reading: 'のむ', meaning: 'to drink', exampleSentence: 'コーヒーを飲みます。', exampleReading: 'こーひーをのみます。', exampleMeaning: 'I drink coffee.', partOfSpeech: 'verb' },
  { word: '見る', reading: 'みる', meaning: 'to see, to watch', exampleSentence: 'テレビを見ます。', exampleReading: 'てれびをみます。', exampleMeaning: 'I watch TV.', partOfSpeech: 'verb' },
  { word: '行く', reading: 'いく', meaning: 'to go', exampleSentence: '学校に行きます。', exampleReading: 'がっこうにいきます。', exampleMeaning: 'I go to school.', partOfSpeech: 'verb' },
  { word: '来る', reading: 'くる', meaning: 'to come', exampleSentence: '明日来てください。', exampleReading: 'あしたきてください。', exampleMeaning: 'Please come tomorrow.', partOfSpeech: 'verb' },
  { word: 'する', reading: 'する', meaning: 'to do', exampleSentence: '宿題をします。', exampleReading: 'しゅくだいをします。', exampleMeaning: 'I do homework.', partOfSpeech: 'verb' },
  { word: '言う', reading: 'いう', meaning: 'to say', exampleSentence: '何を言いましたか。', exampleReading: 'なにをいいましたか。', exampleMeaning: 'What did you say?', partOfSpeech: 'verb' },
  { word: '聞く', reading: 'きく', meaning: 'to listen, to ask', exampleSentence: '音楽を聞きます。', exampleReading: 'おんがくをききます。', exampleMeaning: 'I listen to music.', partOfSpeech: 'verb' },
  { word: '読む', reading: 'よむ', meaning: 'to read', exampleSentence: '本を読みます。', exampleReading: 'ほんをよみます。', exampleMeaning: 'I read books.', partOfSpeech: 'verb' },
  { word: '書く', reading: 'かく', meaning: 'to write', exampleSentence: '手紙を書きます。', exampleReading: 'てがみをかきます。', exampleMeaning: 'I write a letter.', partOfSpeech: 'verb' },
  { word: '話す', reading: 'はなす', meaning: 'to speak, to talk', exampleSentence: '日本語で話しましょう。', exampleReading: 'にほんごではなしましょう。', exampleMeaning: 'Let\'s talk in Japanese.', partOfSpeech: 'verb' },
  { word: '買う', reading: 'かう', meaning: 'to buy', exampleSentence: 'スーパーで野菜を買います。', exampleReading: 'すーぱーでやさいをかいます。', exampleMeaning: 'I buy vegetables at the supermarket.', partOfSpeech: 'verb' },
  { word: '帰る', reading: 'かえる', meaning: 'to return, to go home', exampleSentence: '六時に家に帰ります。', exampleReading: 'ろくじにいえにかえります。', exampleMeaning: 'I return home at six o\'clock.', partOfSpeech: 'verb' },
  { word: '起きる', reading: 'おきる', meaning: 'to wake up, to get up', exampleSentence: '毎朝七時に起きます。', exampleReading: 'まいあさしちじにおきます。', exampleMeaning: 'I wake up at seven every morning.', partOfSpeech: 'verb' },
  { word: '寝る', reading: 'ねる', meaning: 'to sleep, to go to bed', exampleSentence: '十一時に寝ます。', exampleReading: 'じゅういちじにねます。', exampleMeaning: 'I go to bed at eleven.', partOfSpeech: 'verb' },
  { word: '働く', reading: 'はたらく', meaning: 'to work', exampleSentence: '会社で働いています。', exampleReading: 'かいしゃではたらいています。', exampleMeaning: 'I work at a company.', partOfSpeech: 'verb' },
  { word: '勉強する', reading: 'べんきょうする', meaning: 'to study', exampleSentence: '毎日日本語を勉強します。', exampleReading: 'まいにちにほんごをべんきょうします。', exampleMeaning: 'I study Japanese every day.', partOfSpeech: 'verb' },
  { word: '分かる', reading: 'わかる', meaning: 'to understand', exampleSentence: '日本語が分かりますか。', exampleReading: 'にほんごがわかりますか。', exampleMeaning: 'Do you understand Japanese?', partOfSpeech: 'verb' },
  { word: 'ある', reading: 'ある', meaning: 'to exist (inanimate), to have', exampleSentence: '駅の近くにコンビニがあります。', exampleReading: 'えきのちかくにこんびにがあります。', exampleMeaning: 'There is a convenience store near the station.', partOfSpeech: 'verb' },
  { word: 'いる', reading: 'いる', meaning: 'to exist (animate), to be', exampleSentence: '猫が部屋にいます。', exampleReading: 'ねこがへやにいます。', exampleMeaning: 'There is a cat in the room.', partOfSpeech: 'verb' },
  { word: '待つ', reading: 'まつ', meaning: 'to wait', exampleSentence: 'ここで待ってください。', exampleReading: 'ここでまってください。', exampleMeaning: 'Please wait here.', partOfSpeech: 'verb' },
  { word: '会う', reading: 'あう', meaning: 'to meet', exampleSentence: '友達に会いました。', exampleReading: 'ともだちにあいました。', exampleMeaning: 'I met my friend.', partOfSpeech: 'verb' },

  // ── い-Adjectives ─────────────────────────────────────────────────────────
  { word: '大きい', reading: 'おおきい', meaning: 'big, large', exampleSentence: 'この犬は大きいです。', exampleReading: 'このいぬはおおきいです。', exampleMeaning: 'This dog is big.', partOfSpeech: 'i-adjective' },
  { word: '小さい', reading: 'ちいさい', meaning: 'small, little', exampleSentence: 'この部屋は小さいです。', exampleReading: 'このへやはちいさいです。', exampleMeaning: 'This room is small.', partOfSpeech: 'i-adjective' },
  { word: '新しい', reading: 'あたらしい', meaning: 'new', exampleSentence: '新しいスマホを買いました。', exampleReading: 'あたらしいすまほをかいました。', exampleMeaning: 'I bought a new smartphone.', partOfSpeech: 'i-adjective' },
  { word: '古い', reading: 'ふるい', meaning: 'old (not for people)', exampleSentence: 'この建物は古いです。', exampleReading: 'このたてものはふるいです。', exampleMeaning: 'This building is old.', partOfSpeech: 'i-adjective' },
  { word: '高い', reading: 'たかい', meaning: 'expensive, high', exampleSentence: 'このかばんは高いです。', exampleReading: 'このかばんはたかいです。', exampleMeaning: 'This bag is expensive.', partOfSpeech: 'i-adjective' },
  { word: '安い', reading: 'やすい', meaning: 'cheap, inexpensive', exampleSentence: 'このレストランは安いです。', exampleReading: 'このれすとらんはやすいです。', exampleMeaning: 'This restaurant is cheap.', partOfSpeech: 'i-adjective' },
  { word: '良い', reading: 'よい', meaning: 'good', exampleSentence: '今日はいい天気です。', exampleReading: 'きょうはいいてんきです。', exampleMeaning: 'Today is nice weather.', partOfSpeech: 'i-adjective' },
  { word: '悪い', reading: 'わるい', meaning: 'bad', exampleSentence: '天気が悪いです。', exampleReading: 'てんきがわるいです。', exampleMeaning: 'The weather is bad.', partOfSpeech: 'i-adjective' },
  { word: '暑い', reading: 'あつい', meaning: 'hot (weather)', exampleSentence: '夏は暑いです。', exampleReading: 'なつはあついです。', exampleMeaning: 'Summer is hot.', partOfSpeech: 'i-adjective' },
  { word: '寒い', reading: 'さむい', meaning: 'cold (weather)', exampleSentence: '冬は寒いです。', exampleReading: 'ふゆはさむいです。', exampleMeaning: 'Winter is cold.', partOfSpeech: 'i-adjective' },
  { word: '楽しい', reading: 'たのしい', meaning: 'fun, enjoyable', exampleSentence: 'パーティーが楽しかったです。', exampleReading: 'ぱーてぃーがたのしかったです。', exampleMeaning: 'The party was fun.', partOfSpeech: 'i-adjective' },
  { word: '難しい', reading: 'むずかしい', meaning: 'difficult', exampleSentence: '漢字は難しいです。', exampleReading: 'かんじはむずかしいです。', exampleMeaning: 'Kanji is difficult.', partOfSpeech: 'i-adjective' },
  { word: '易しい', reading: 'やさしい', meaning: 'easy', exampleSentence: 'この問題は易しいです。', exampleReading: 'このもんだいはやさしいです。', exampleMeaning: 'This problem is easy.', partOfSpeech: 'i-adjective' },
  { word: '長い', reading: 'ながい', meaning: 'long', exampleSentence: 'この川は長いです。', exampleReading: 'このかわはながいです。', exampleMeaning: 'This river is long.', partOfSpeech: 'i-adjective' },
  { word: '短い', reading: 'みじかい', meaning: 'short', exampleSentence: '夏休みは短いです。', exampleReading: 'なつやすみはみじかいです。', exampleMeaning: 'Summer vacation is short.', partOfSpeech: 'i-adjective' },

  // ── な-Adjectives ─────────────────────────────────────────────────────────
  { word: '好き', reading: 'すき', meaning: 'liked, favorite', exampleSentence: '音楽が好きです。', exampleReading: 'おんがくがすきです。', exampleMeaning: 'I like music.', partOfSpeech: 'na-adjective' },
  { word: '嫌い', reading: 'きらい', meaning: 'disliked', exampleSentence: '虫が嫌いです。', exampleReading: 'むしがきらいです。', exampleMeaning: 'I dislike insects.', partOfSpeech: 'na-adjective' },
  { word: '元気', reading: 'げんき', meaning: 'healthy, energetic', exampleSentence: '元気ですか。', exampleReading: 'げんきですか。', exampleMeaning: 'How are you? (Are you well?)', partOfSpeech: 'na-adjective' },
  { word: '便利', reading: 'べんり', meaning: 'convenient', exampleSentence: '駅の近くは便利です。', exampleReading: 'えきのちかくはべんりです。', exampleMeaning: 'Near the station is convenient.', partOfSpeech: 'na-adjective' },
  { word: '静か', reading: 'しずか', meaning: 'quiet', exampleSentence: '図書館は静かです。', exampleReading: 'としょかんはしずかです。', exampleMeaning: 'The library is quiet.', partOfSpeech: 'na-adjective' },
  { word: '有名', reading: 'ゆうめい', meaning: 'famous', exampleSentence: '富士山は有名です。', exampleReading: 'ふじさんはゆうめいです。', exampleMeaning: 'Mount Fuji is famous.', partOfSpeech: 'na-adjective' },

  // ── Question Words ────────────────────────────────────────────────────────
  { word: '何', reading: 'なに', meaning: 'what', exampleSentence: '何が好きですか。', exampleReading: 'なにがすきですか。', exampleMeaning: 'What do you like?', partOfSpeech: 'pronoun' },
  { word: '誰', reading: 'だれ', meaning: 'who', exampleSentence: 'あの人は誰ですか。', exampleReading: 'あのひとはだれですか。', exampleMeaning: 'Who is that person?', partOfSpeech: 'pronoun' },
  { word: 'どこ', reading: 'どこ', meaning: 'where', exampleSentence: 'トイレはどこですか。', exampleReading: 'といれはどこですか。', exampleMeaning: 'Where is the bathroom?', partOfSpeech: 'pronoun' },
  { word: 'いつ', reading: 'いつ', meaning: 'when', exampleSentence: 'いつ日本に来ましたか。', exampleReading: 'いつにほんにきましたか。', exampleMeaning: 'When did you come to Japan?', partOfSpeech: 'pronoun' },
  { word: 'どう', reading: 'どう', meaning: 'how', exampleSentence: '日本語の勉強はどうですか。', exampleReading: 'にほんごのべんきょうはどうですか。', exampleMeaning: 'How is your Japanese study?', partOfSpeech: 'pronoun' },
  { word: 'なぜ', reading: 'なぜ', meaning: 'why', exampleSentence: 'なぜ日本語を勉強していますか。', exampleReading: 'なぜにほんごをべんきょうしていますか。', exampleMeaning: 'Why are you studying Japanese?', partOfSpeech: 'pronoun' },
  { word: 'いくら', reading: 'いくら', meaning: 'how much', exampleSentence: 'これはいくらですか。', exampleReading: 'これはいくらですか。', exampleMeaning: 'How much is this?', partOfSpeech: 'pronoun' },

  // ── Numbers ───────────────────────────────────────────────────────────────
  { word: '一', reading: 'いち', meaning: 'one', partOfSpeech: 'number' },
  { word: '二', reading: 'に', meaning: 'two', partOfSpeech: 'number' },
  { word: '三', reading: 'さん', meaning: 'three', partOfSpeech: 'number' },
  { word: '四', reading: 'し・よん', meaning: 'four', partOfSpeech: 'number' },
  { word: '五', reading: 'ご', meaning: 'five', partOfSpeech: 'number' },
  { word: '六', reading: 'ろく', meaning: 'six', partOfSpeech: 'number' },
  { word: '七', reading: 'しち・なな', meaning: 'seven', partOfSpeech: 'number' },
  { word: '八', reading: 'はち', meaning: 'eight', partOfSpeech: 'number' },
  { word: '九', reading: 'く・きゅう', meaning: 'nine', partOfSpeech: 'number' },
  { word: '十', reading: 'じゅう', meaning: 'ten', partOfSpeech: 'number' },
  { word: '百', reading: 'ひゃく', meaning: 'hundred', partOfSpeech: 'number' },
  { word: '千', reading: 'せん', meaning: 'thousand', partOfSpeech: 'number' },
]

export default n5Vocab
