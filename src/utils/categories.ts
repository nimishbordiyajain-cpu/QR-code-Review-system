import { BusinessCategory } from '../types';

export interface ExperienceCategoryDefinition {
  title: string;
  iconName: string;
  positiveOptions: string[];
  constructiveOptions: string[];
}

export function getDefaultCategoriesForType(category: BusinessCategory): ExperienceCategoryDefinition[] {
  switch (category) {
    case 'Restaurant':
    case 'Café':
      return [
        {
          title: 'Food & Beverage',
          iconName: 'Utensils',
          positiveOptions: ['Delicious food', 'Fresh ingredients', 'Great presentation', 'Tasty drinks', 'Specialty coffee'],
          constructiveOptions: ['Food temperature off', 'Flavor lacked seasoning', 'Portion size small', 'Item was out of stock'],
        },
        {
          title: 'Staff & Hospitality',
          iconName: 'Smile',
          positiveOptions: ['Warm & welcoming', 'Attentive staff', 'Helpful recommendations', 'Courteous service'],
          constructiveOptions: ['Staff felt distracted', 'Hard to get attention', 'Unfriendly interaction'],
        },
        {
          title: 'Service Speed',
          iconName: 'Zap',
          positiveOptions: ['Very fast service', 'Timely food delivery', 'Smooth ordering', 'Quick billing'],
          constructiveOptions: ['Long wait for food', 'Delayed bill', 'Slow order taking'],
        },
        {
          title: 'Cleanliness & Hygiene',
          iconName: 'Sparkles',
          positiveOptions: ['Spotless tables', 'Clean restrooms', 'Hygienic setup', 'Tidy cutlery'],
          constructiveOptions: ['Table needed wiping', 'Restroom needed attention', 'Cluttered area'],
        },
        {
          title: 'Ambience & Comfort',
          iconName: 'Music',
          positiveOptions: ['Great atmosphere', 'Pleasant music & lighting', 'Comfortable seating', 'Nice decor'],
          constructiveOptions: ['Too noisy', 'Uncomfortable temperature', 'Crowded layout'],
        },
        {
          title: 'Value for Money',
          iconName: 'BadgePercent',
          positiveOptions: ['Great value', 'Fair pricing', 'Generous portions', 'Worth every penny'],
          constructiveOptions: ['Priced a bit high', 'Did not feel good value'],
        },
      ];

    case 'Salon':
    case 'Beauty':
      return [
        {
          title: 'Treatment / Styling Quality',
          iconName: 'Scissors',
          positiveOptions: ['Loved the final look', 'Precision styling', 'Great attention to detail', 'Quality products used'],
          constructiveOptions: ['Not what I requested', 'Uneven result', 'Product caused sensitivity'],
        },
        {
          title: 'Stylist & Staff',
          iconName: 'Smile',
          positiveOptions: ['Consultative & polite', 'Very skilled stylist', 'Gentle touch', 'Listened carefully'],
          constructiveOptions: ['Rushed through service', 'Did not listen to preference'],
        },
        {
          title: 'Punctuality & Timing',
          iconName: 'Clock',
          positiveOptions: ['Started right on time', 'Efficient appointment', 'No waiting time'],
          constructiveOptions: ['Started late despite appointment', 'Service took much longer than expected'],
        },
        {
          title: 'Hygiene & Cleanliness',
          iconName: 'Sparkles',
          positiveOptions: ['Sterilized tools', 'Clean stations', 'Fresh towels & capes'],
          constructiveOptions: ['Station had hair from previous client', 'Messy workspace'],
        },
        {
          title: 'Salon Ambience',
          iconName: 'Flame',
          positiveOptions: ['Relaxing environment', 'Calm vibe', 'Comfortable chairs'],
          constructiveOptions: ['Too loud/chaotic', 'Uncomfortable seating'],
        },
        {
          title: 'Pricing & Transparency',
          iconName: 'BadgePercent',
          positiveOptions: ['Transparent pricing', 'Great value for expertise'],
          constructiveOptions: ['Surprise extra charges', 'Overpriced'],
        },
      ];

    case 'Gym':
      return [
        {
          title: 'Equipment & Facilities',
          iconName: 'Dumbbell',
          positiveOptions: ['Modern equipment', 'Well-maintained machines', 'Plenty of weights & benches', 'Spacious turf'],
          constructiveOptions: ['Broken equipment', 'Not enough dumbbells/benches during peak'],
        },
        {
          title: 'Cleanliness & Sanitation',
          iconName: 'Sparkles',
          positiveOptions: ['Spotless locker rooms', 'Clean sanitized mats', 'Sanitizer wipes stocked'],
          constructiveOptions: ['Smelly locker room', 'Sweaty uncleaned machines'],
        },
        {
          title: 'Trainers & Staff',
          iconName: 'Smile',
          positiveOptions: ['Motivating coaches', 'Helpful floor trainers', 'Friendly front desk'],
          constructiveOptions: ['Unapproachable staff', 'Trainers pushy with sales'],
        },
        {
          title: 'Atmosphere & Music',
          iconName: 'Music',
          positiveOptions: ['Energizing music', 'Good ventilation/AC', 'Supportive community'],
          constructiveOptions: ['AC too warm/stuffy', 'Music deafeningly loud'],
        },
        {
          title: 'Value & Membership',
          iconName: 'BadgePercent',
          positiveOptions: ['Great membership perks', 'Fair monthly rates'],
          constructiveOptions: ['Crowded at peak hours', 'Expensive drop-in fees'],
        },
      ];

    case 'Hotel':
      return [
        {
          title: 'Room & Comfort',
          iconName: 'Bed',
          positiveOptions: ['Comfortable bed', 'Quiet room', 'Great view', 'Excellent amenities'],
          constructiveOptions: ['Noisy AC/neighbors', 'Uncomfortable pillows', 'Outdated furnishings'],
        },
        {
          title: 'Hospitality & Front Desk',
          iconName: 'Smile',
          positiveOptions: ['Warm welcome', 'Seamless check-in', 'Helpful concierge', 'Prompt room service'],
          constructiveOptions: ['Slow check-in line', 'Unhelpful front desk staff'],
        },
        {
          title: 'Cleanliness',
          iconName: 'Sparkles',
          positiveOptions: ['Immaculate bathroom', 'Crisp clean linen', 'Thorough daily housekeeping'],
          constructiveOptions: ['Stained linen', 'Bathroom had soap scum', 'Missed housekeeping'],
        },
        {
          title: 'Facilities & Breakfast',
          iconName: 'Coffee',
          positiveOptions: ['Delicious breakfast spread', 'Refreshing pool', 'Fast Wi-Fi', 'Convenient parking'],
          constructiveOptions: ['Breakfast options limited/cold', 'Slow internet connection'],
        },
        {
          title: 'Overall Value',
          iconName: 'BadgePercent',
          positiveOptions: ['Exceptional stay', 'Worth the rate', 'Will return'],
          constructiveOptions: ['Hidden resort/parking fees', 'Overpriced for quality'],
        },
      ];

    case 'Clinic':
      return [
        {
          title: 'Doctor & Care Quality',
          iconName: 'HeartPulse',
          positiveOptions: ['Thorough explanation', 'Empathetic physician', 'Clear treatment plan', 'Gentle procedure'],
          constructiveOptions: ['Felt rushed during consult', 'Doctor seemed inattentive'],
        },
        {
          title: 'Staff & Reception',
          iconName: 'Smile',
          positiveOptions: ['Polite front desk', 'Gentle nurses & assistants', 'Smooth billing'],
          constructiveOptions: ['Disorganized front desk', 'Unresponsive phone assistance'],
        },
        {
          title: 'Wait Time & Scheduling',
          iconName: 'Clock',
          positiveOptions: ['Seen promptly at appointment time', 'Easy scheduling', 'Minimal waiting'],
          constructiveOptions: ['Waited >45 mins past appointment', 'Delayed scheduling'],
        },
        {
          title: 'Hygiene & Safety',
          iconName: 'ShieldCheck',
          positiveOptions: ['Ultra-clean clinic', 'Sterile environment', 'Modern equipment'],
          constructiveOptions: ['Waiting room felt cluttered', 'Sanitation could improve'],
        },
      ];

    default:
      // Generic fallback for retail, service businesses, etc.
      return [
        {
          title: 'Quality of Service / Product',
          iconName: 'Award',
          positiveOptions: ['High quality results', 'Exceeded expectations', 'Reliable work', 'Great selection'],
          constructiveOptions: ['Quality fell short', 'Did not meet expectations', 'Defective or incomplete'],
        },
        {
          title: 'Staff Professionalism',
          iconName: 'Smile',
          positiveOptions: ['Friendly & polite', 'Very knowledgeable', 'Responsive communication', 'Helpful guidance'],
          constructiveOptions: ['Unprofessional communication', 'Hard to get answers', 'Unfriendly behavior'],
        },
        {
          title: 'Speed & Efficiency',
          iconName: 'Zap',
          positiveOptions: ['Fast turnaround', 'On-time completion', 'Swift service', 'Quick checkout'],
          constructiveOptions: ['Delays in delivery/service', 'Took much longer than agreed'],
        },
        {
          title: 'Facility & Cleanliness',
          iconName: 'Sparkles',
          positiveOptions: ['Clean & organized', 'Pleasant store/office', 'Well-kept space'],
          constructiveOptions: ['Disorganized area', 'Needs tidying up'],
        },
        {
          title: 'Pricing & Value',
          iconName: 'BadgePercent',
          positiveOptions: ['Fair & transparent price', 'Great overall value', 'Honest billing'],
          constructiveOptions: ['Price felt higher than value', 'Lack of upfront pricing'],
        },
      ];
  }
}
