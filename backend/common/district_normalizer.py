# District Name Normalization Dictionary
# This mapping consolidates duplicate district entries caused by:
# - Spelling variations
# - Case inconsistencies  
# - Special character differences
# - Naming format changes

DISTRICT_NORMALIZATION_MAP = {
    # Andaman and Nicobar Islands
    'Nicobars': 'Nicobar',
    
    # Andhra Pradesh
    'Ananthapur': 'Anantapur',
    'Ananthapuramu': 'Anantapur',
    'chittoor': 'Chittoor',
    'K.V.Rangareddy': 'Rangareddy',
    'K.v. Rangareddy': 'Rangareddy',
    'Karim Nagar': 'Karimnagar',
    'Mahabub Nagar': 'Mahabubnagar',
    'Mahbubnagar': 'Mahabubnagar',
    'rangareddi': 'Rangareddy',
    'Spsr Nellore': 'Sri Potti Sriramulu Nellore',
    'Visakhapatanam': 'Visakhapatnam',
    
    # Assam
    'Sibsagar': 'Sivasagar',
    
    # Bihar
    'Aurangabad(BH)': 'Aurangabad',
    'Aurangabad(bh)': 'Aurangabad',
    'Purba Champaran': 'East Champaran',
    'Purbi Champaran': 'East Champaran',
    'Pashchim Champaran': 'West Champaran',
    'Purnia': 'Purnea',
    'Samstipur': 'Samastipur',
    'Sheikpura': 'Sheikhpura',
    'Monghyr': 'Munger',
    
    # Chhattisgarh
    'Janjgir - Champa': 'Janjgir Champa',
    'Janjgir-champa': 'Janjgir Champa',
    'Gaurella Pendra Marwahi': 'Gaurela-pendra-marwahi',
    'Mohalla-Manpur-Ambagarh Chowki': 'Mohla-Manpur-Ambagarh Chouki',
    'Kabeerdham': 'Kawardha',
    
    # Dadra and Nagar Haveli and Daman and Diu
    'Dadra \u0026 Nagar Haveli': 'Dadra and Nagar Haveli',
    'Dadra And Nagar Haveli': 'Dadra and Nagar Haveli',
    
    # Delhi
    'North East   *': 'North East Delhi',
    'North East': 'North East Delhi',
    
    # Gujarat
    'Ahmadabad': 'Ahmedabad',
    'Banaskantha': 'Banas Kantha',
    'Sabarkantha': 'Sabar Kantha',
    'Panchmahals': 'Panch Mahals',
    'Panchmhals': 'Panch Mahals',
    'Dahod': 'Dohad',
    'The Dangs': 'Dang',
    'Surendra Nagar': 'Surendranagar',
    
    # Haryana
    'Jhajjar *': 'Jhajjar',
    'Gurgaon': 'Gurugram',
    'Mewat': 'Nuh',
    'Yamunanagar': 'Yamuna Nagar',
    
    # Himachal Pradesh
    'Lahaul and Spiti': 'Lahul and Spiti',
    'Lahul \u0026 Spiti': 'Lahul and Spiti',
    
    # Jammu and Kashmir
    'Badgam': 'Budgam',
    'Bandipore': 'Bandipur',
    'Leh (ladakh)': 'Leh',
    'Rajauri': 'Rajouri',
    'punch': 'Punch',
    'Shupiyan': 'Shopian',
    
    # Jharkhand
    'Bokaro *': 'Bokaro',
    'Garhwa *': 'Garhwa',
    'Hazaribag': 'Hazaribagh',
    'Kodarma': 'Koderma',
    'Pakaur': 'Pakur',
    'Palamau': 'Palamu',
    'Pashchimi Singhbhum': 'West Singhbhum',
    'Purbi Singhbhum': 'East Singhbhum',
    'East Singhbum': 'East Singhbhum',
    'Sahebganj': 'Sahibganj',
    'Seraikela-kharsawan': 'Seraikela-Kharsawan',
    
    # Karnataka
    'Bagalkot *': 'Bagalkot',
    'Bangalore': 'Bengaluru Urban',
    'Bengaluru': 'Bengaluru Urban',
    'Bengaluru South': 'Bengaluru Urban',
    'Belagavi': 'Belgaum',
    'Bellary': 'Ballari',
    'Bijapur': 'Vijayapura',
    'Bijapur(KAR)': 'Vijayapura',
    'Chamarajanagar': 'Chamarajanagar',
    'Chamarajanagar *': 'Chamarajanagar',
    'Chamrajanagar': 'Chamarajanagar',
    'Chamrajnagar': 'Chamarajanagar',
    'Chickmagalur': 'Chikkamagaluru',
    'Chikmagalur': 'Chikkamagaluru',
    'Davangere': 'Davanagere',
    'Gadag *': 'Gadag',
    'Gulbarga': 'Kalaburagi',
    'Hasan': 'Hassan',
    'Haveri *': 'Haveri',
    'Mysore': 'Mysuru',
    'Ramanagar': 'Ramanagara',
    'Shimoga': 'Shivamogga',
    'Tumkur': 'Tumakuru',
    'Udupi *': 'Udupi',
    'yadgir': 'Yadgir',
    
    # Kerala
    'Kasargod': 'Kasaragod',
    
    # Madhya Pradesh
    'Ashok Nagar': 'Ashoknagar',
    'Harda *': 'Harda',
    'Narsimhapur': 'Narsinghpur',
    
    # Maharashtra
    'Ahmadnagar': 'Ahmednagar',
    'Ahmed Nagar': 'Ahmednagar',
    'Ahilyanagar': 'Ahmednagar',
    'Aurangabad': 'Chhatrapati Sambhajinagar',
    'Chatrapati Sambhaji Nagar': 'Chhatrapati Sambhajinagar',
    'Bid': 'Beed',
    'Buldana': 'Buldhana',
    'Gondiya': 'Gondia',
    'Gondiya *': 'Gondia',
    'Hingoli *': 'Hingoli',
    'Mumbai( Sub Urban )': 'Mumbai Suburban',
    'Nandurbar *': 'Nandurbar',
    'Osmanabad': 'Dharashiv',
    'Raigarh': 'Raigad',
    'Raigarh(MH)': 'Raigad',
    'Washim *': 'Washim',
    
    # Mizoram
    'Mammit': 'Mamit',
    
    # Odisha
    'ANGUL': 'Angul',
    'ANUGUL': 'Angul',
    'Anugal': 'Angul',
    'Anugul': 'Angul',
    'Baleshwar': 'Balasore',
    'Baleswar': 'Balasore',
    'Baudh': 'Boudh',
    'JAJPUR': 'Jajpur',
    'jajpur': 'Jajpur',
    'Jajapur': 'Jajpur',
    'Jagatsinghapur': 'Jagatsinghpur',
    'Kendrapara *': 'Kendrapara',
    'Khorda': 'Khordha',
    'Nabarangapur': 'Nabarangpur',
    'NUAPADA': 'Nuapada',
    'Sonapur': 'Subarnapur',
    'Sundergarh': 'Sundargarh',
    
    # Puducherry
    'Pondicherry': 'Puducherry',
    
    # Punjab
    'Ferozepur': 'Firozpur',
    'Nawanshahr': 'Shaheed Bhagat Singh Nagar',
    'S.A.S Nagar': 'SAS Nagar (Mohali)',
    'S.A.S Nagar(Mohali)': 'SAS Nagar (Mohali)',
    'Muktsar': 'Sri Muktsar Sahib',
    'Tarn Taran': 'Tarn Taran',
    
    # Rajasthan
    'Chittaurgarh': 'Chittorgarh',
    'Deeg ': 'Deeg',
    'Dhaulpur': 'Dholpur',
    'Jalore': 'Jalor',
    'Jhunjhunun': 'Jhunjhunu',
    'Ganganagar': 'Sri Ganganagar',
    
    # Sikkim
    'East': 'East Sikkim',
    'North': 'North Sikkim',
    'South': 'South Sikkim',
    'West': 'West Sikkim',
    'Mangan': 'North Sikkim',
    'Namchi': 'South Sikkim',
    
    # Tamil Nadu
    'Kanchipuram': 'Kancheepuram',
    'Kanniyakumari': 'Kanyakumari',
    'Namakkal   *': 'Namakkal',
    'Tirupathur': 'Tirupattur',
    'Tuticorin': 'Thoothukkudi',
    'Tiruvallur': 'Thiruvallur',
    'Tiruvarur': 'Thiruvarur',
    'Viluppuram': 'Villupuram',
    
    # Telangana
    'Jangoan': 'Jangaon',
    'Medchal Malkajgiri': 'Medchal-malkajgiri',
    'Medchal?malkajgiri': 'Medchal-malkajgiri',
    'Medchal−malkajgiri': 'Medchal-malkajgiri',
    'Ranga Reddy': 'Rangareddy',
    'Warangal (urban)': 'Warangal Urban',
    
    # Tripura
    'Dhalai  *': 'Dhalai',
    
    # Uttar Pradesh
    'Allahabad': 'Prayagraj',
    'Baghpat': 'Bagpat',
    'Bara Banki': 'Barabanki',
    'Bulandshahar': 'Bulandshahr',
    'Faizabad': 'Ayodhya',
    'Kushi Nagar': 'Kushinagar',
    'Kushinagar *': 'Kushinagar',
    'Maharajganj': 'Maharajganj',
    'Mahrajganj': 'Maharajganj',
    'Rae Bareli': 'Raebareli',
    'Shrawasti': 'Shravasti',
    'Siddharth Nagar': 'Siddharthnagar',
    
    # Uttarakhand
    'Hardwar': 'Haridwar',
    'Garhwal': 'Pauri Garhwal',
    
    # West Bengal
    '24 Paraganas North': 'North 24 Parganas',
    '24 Paraganas South': 'South 24 Parganas',
    'Barddhaman': 'Bardhaman',
    'Burdwan': 'Bardhaman',
    'Coochbehar': 'Cooch Behar',
    'Koch Bihar': 'Cooch Behar',
    'Darjiling': 'Darjeeling',
    'Dinajpur Dakshin': 'Dakshin Dinajpur',
    'South Dinajpur': 'Dakshin Dinajpur',
    'Dinajpur Uttar': 'Uttar Dinajpur',
    'North Dinajpur': 'Uttar Dinajpur',
    'East Midnapur': 'East Midnapore',
    'HOOGHLY': 'Hooghly',
    'Hooghiy': 'Hooghly',
    'Hugli': 'Hooghly',
    'hooghly': 'Hooghly',
    'HOWRAH': 'Howrah',
    'Haora': 'Howrah',
    'Hawrah': 'Howrah',
    'KOLKATA': 'Kolkata',
    'MALDA': 'Malda',
    'Maldah': 'Malda',
    'Medinipur West': 'West Medinipur',
    'West Midnapore': 'West Medinipur',
    'NADIA': 'Nadia',
    'nadia': 'Nadia',
    'North Twenty Four Parganas': 'North 24 Parganas',
    'South 24 Pargana': 'South 24 Parganas',
    'South 24 parganas': 'South 24 Parganas',
    'South Twenty Four Parganas': 'South 24 Parganas',
    'Puruliya': 'Purulia',
}
