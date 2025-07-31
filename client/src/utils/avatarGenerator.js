// AI Girl Avatar Generator Utility
// Uses various placeholder services to generate beautiful AI-style avatars

const AI_GIRL_STYLES = [
  'adventurer-neutral',
  'avataaars-neutral', 
  'big-ears-neutral',
  'big-smile',
  'bottts-neutral',
  'fun-emoji',
  'micah',
  'miniavs',
  'open-peeps',
  'personas',
  'pixel-art-neutral'
];

const HAIR_COLORS = [
  'black', 'brown', 'blonde', 'red', 'pink', 'blue', 'purple', 'silver'
];

const SKIN_TONES = [
  'light', 'medium', 'dark', 'tan'
];

const EXPRESSIONS = [
  'happy', 'smile', 'wink', 'surprised', 'cool', 'confident'
];

// Generate random AI girl avatar using DiceBear API
export const generateAIGirlAvatar = (seed = null, style = null) => {
  const randomSeed = seed || Math.random().toString(36).substring(7);
  const selectedStyle = style || AI_GIRL_STYLES[Math.floor(Math.random() * AI_GIRL_STYLES.length)];
  
  // DiceBear API for AI-style avatars
  const baseUrl = 'https://api.dicebear.com/7.x';
  
  // Different styles for variety
  const styleOptions = {
    'adventurer-neutral': {
      url: `${baseUrl}/adventurer-neutral/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'avataaars-neutral': {
      url: `${baseUrl}/avataaars-neutral/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient&hair=longHairStraight,longHairCurly,longHairWavy'
    },
    'big-ears-neutral': {
      url: `${baseUrl}/big-ears-neutral/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'bottts-neutral': {
      url: `${baseUrl}/bottts-neutral/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient&colors=pink,purple,blue'
    },
    'fun-emoji': {
      url: `${baseUrl}/fun-emoji/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'micah': {
      url: `${baseUrl}/micah/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'miniavs': {
      url: `${baseUrl}/miniavs/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'open-peeps': {
      url: `${baseUrl}/open-peeps/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'personas': {
      url: `${baseUrl}/personas/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    },
    'pixel-art-neutral': {
      url: `${baseUrl}/pixel-art-neutral/svg?seed=${randomSeed}`,
      params: '&backgroundColor=gradient'
    }
  };

  const selectedOption = styleOptions[selectedStyle] || styleOptions['adventurer-neutral'];
  return `${selectedOption.url}${selectedOption.params}`;
};

// Generate casino-themed AI girl avatar
export const generateCasinoGirlAvatar = (seed = null) => {
  const randomSeed = seed || `casino_${Math.random().toString(36).substring(7)}`;
  const style = 'adventurer-neutral'; // Best style for casino theme
  
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}&backgroundColor=gradient&hair=longHairStraight,longHairCurly&accessories=sunglasses&clothing=blazer`;
};

// Generate multiple random avatars for selection
export const generateAvatarOptions = (count = 6) => {
  const avatars = [];
  for (let i = 0; i < count; i++) {
    avatars.push({
      id: i,
      url: generateAIGirlAvatar(`option_${i}_${Date.now()}`),
      style: AI_GIRL_STYLES[Math.floor(Math.random() * AI_GIRL_STYLES.length)]
    });
  }
  return avatars;
};

// Get avatar based on user data
export const getUserAvatar = (user) => {
  if (user?.avatar && user.avatar.startsWith('http')) {
    return user.avatar;
  }
  
  // Generate consistent avatar based on user ID or username
  const seed = user?._id || user?.username || 'default';
  return generateAIGirlAvatar(seed);
};

// Alternative AI girl image services
export const getRandomAIGirlImage = (category = 'avatar') => {
  const services = {
    avatar: [
      () => generateAIGirlAvatar(),
      () => `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
      () => `https://api.adorable.io/avatars/200/${Math.random().toString(36).substring(7)}.png`,
      () => `https://robohash.org/${Math.random().toString(36).substring(7)}.png?set=set4&size=200x200`
    ],
    profile: [
      () => generateCasinoGirlAvatar(),
      () => `https://picsum.photos/300/300?random=${Math.floor(Math.random() * 1000)}`,
      () => generateAIGirlAvatar(null, 'personas')
    ],
    banner: [
      () => `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`,
      () => `https://source.unsplash.com/800x400/?casino,luxury,${Math.floor(Math.random() * 100)}`
    ]
  };

  const categoryServices = services[category] || services.avatar;
  const randomService = categoryServices[Math.floor(Math.random() * categoryServices.length)];
  
  return randomService();
};

// Preload common avatars for better performance
export const preloadAvatars = () => {
  const avatars = generateAvatarOptions(10);
  avatars.forEach(avatar => {
    const img = new Image();
    img.src = avatar.url;
  });
};

// Casino dealer girl avatars for game interface
export const getCasinoDealerAvatar = () => {
  const dealerSeeds = ['dealer1', 'dealer2', 'dealer3', 'dealer4', 'dealer5'];
  const randomSeed = dealerSeeds[Math.floor(Math.random() * dealerSeeds.length)];
  
  return `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${randomSeed}&backgroundColor=gradient&hair=longHairStraight&clothing=blazer&accessories=prescription02`;
};

// AI girl images for different game rooms
export const getRoomHostessAvatar = (roomName) => {
  const roomSeeds = {
    'Beginner': 'hostess_beginner',
    'Intermediate': 'hostess_intermediate', 
    'Advanced': 'hostess_advanced',
    'VIP': 'hostess_vip'
  };
  
  const seed = roomSeeds[roomName] || 'hostess_default';
  return generateCasinoGirlAvatar(seed);
};

export default {
  generateAIGirlAvatar,
  generateCasinoGirlAvatar,
  generateAvatarOptions,
  getUserAvatar,
  getRandomAIGirlImage,
  preloadAvatars,
  getCasinoDealerAvatar,
  getRoomHostessAvatar
};