import './style.css';

console.log('🚀 MIP + Vite = ❤️');

document.getElementById('btn')?.addEventListener('click', () => {
  alert('🔥 Vite HMR is blazing fast!');
});

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('🔥 HMR updated!');
  });
}