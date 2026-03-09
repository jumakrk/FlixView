const apiKey = 'e3e0dac3e79f074f3b5908195a80c23e';
const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${apiKey}&language=en-US`;

console.log('Testing TMDB API...');
fetch(url)
    .then(res => {
        console.log('Status:', res.status);
        if (!res.ok) {
            return res.text().then(text => {
                console.error('Error Body:', text);
                process.exit(1);
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Success! Found connections:', data.results?.length);
    })
    .catch(err => {
        console.error('Network Error:', err.message);
        process.exit(1);
    });
