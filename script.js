const { createApp } = Vue;

createApp({
    data() {
        return {
            priceHistory: [],
            newEntry: {
                product: '',
                newPrice: '',
                rayon: '',
            },
            selectedRayon: '',
            selectedDate: '', // Ajout de la sélection de la date
            filteredSuggestions: [],
            backupEntry: null, // Pour sauvegarder l'entrée avant édition
        };
    },
    computed: {
        uniqueRayons() {
            return [...new Set(this.priceHistory.map(entry => entry.rayon))];
        },
        
        filteredHistory() {
            let filtered = this.priceHistory;

            // Filtrage par Rayon
            if (this.selectedRayon) {
                filtered = filtered.filter(entry => entry.rayon === this.selectedRayon);
            }

            // Filtrage par Date (filtre sur la dernière modification de produit)
            if (this.selectedDate) {
                const selectedDate = this.convertToDateFormat(this.selectedDate);
                if (!selectedDate) {
                    console.error('Invalid date selected:', this.selectedDate);
                    return [];
                }

                // Format 'YYYY-MM-DD' pour la comparaison
                const selectedDateString = selectedDate.split('T')[0];

                filtered = filtered.filter(entry => {
                    const entryDate = this.convertToDateFormat(entry.date);
                    if (!entryDate) {
                        console.error('Invalid date in entry:', entry.date);
                        return false; // Ignore invalid dates
                    }

                    // Format 'YYYY-MM-DD' pour la comparaison
                    const entryDateString = entryDate.split('T')[0];
                    return entryDateString === selectedDateString;
                });
            }

            return filtered;
        },
    },
    methods: {
        // Convertir la date de format 'DD/MM/YYYY' en format 'YYYY-MM-DD'
        convertToDateFormat(dateStr) {
            // Si la date est déjà au format 'YYYY-MM-DD', la renvoyer telle quelle
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr; // La date est déjà au format attendu
            }

            // Si la date est au format 'DD/MM/YYYY'
            const parts = dateStr.split('/');
            if (parts.length !== 3) {
                return null; // Date invalide
            }

            const [day, month, year] = parts;
            const formattedDate = new Date(`${year}-${month}-${day}`);
            return isNaN(formattedDate.getTime()) ? null : formattedDate.toISOString();
        },

        // Méthode pour filtrer les suggestions de produits
        filterProducts() {
            const searchQuery = this.newEntry.product.toLowerCase();
            this.filteredSuggestions = this.priceHistory.filter(product =>
                product.product.toLowerCase().includes(searchQuery)
            );
        },
        
        // Sélection d'un produit suggéré
        selectProduct(product) {
            this.newEntry.product = product.product;
            this.filteredSuggestions = [];
        },

        async updatePrice() {
            const currentDate = new Date().toLocaleDateString();
            const oldPrice = this.priceHistory.find(entry => entry.product === this.newEntry.product)?.newPrice || 'N/A';

            const entry = {
                id: Date.now(),
                product: this.newEntry.product,
                oldPrice: oldPrice,
                newPrice: parseFloat(this.newEntry.newPrice).toFixed(2),
                rayon: this.newEntry.rayon,
                date: currentDate,
                isEditing: false, // État d'édition
            };

            this.priceHistory.push(entry);
            this.newEntry.product = '';
            this.newEntry.newPrice = '';
            this.newEntry.rayon = '';
            await this.saveData();
        },
        
        // Méthode pour appliquer la modification des prix
        saveData() {
            // Enregistrer les modifications dans la base de données ou autre stockage
            fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.priceHistory),
            });
        },

        async loadData() {
            const response = await fetch('/data.json');
            if (response.ok) {
                this.priceHistory = await response.json();
                this.priceHistory.forEach(entry => (entry.isEditing = false));
            }
        },
        
        editEntry(index) {
            this.priceHistory[index].isEditing = true;
            this.backupEntry = { ...this.priceHistory[index] };
        },
        
        saveEdit(index) {
            this.priceHistory[index].isEditing = false;
            this.backupEntry = null;
            this.saveData();
        },
        
        cancelEdit(index) {
            this.priceHistory[index] = { ...this.backupEntry };
            this.priceHistory[index].isEditing = false;
            this.backupEntry = null;
        },
        
        deleteEntry(index) {
            this.priceHistory.splice(index, 1);
            this.saveData();
        },
    },
    
    async mounted() {
        await this.loadData();
    },
}).mount('#app');
