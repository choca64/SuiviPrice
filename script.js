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
            backupEntry: null, // Pour sauvegarder l'entrée avant édition
        };
    },
    computed: {
        uniqueRayons() {
            return [...new Set(this.priceHistory.map(entry => entry.rayon))];
        },
        filteredHistory() {
            if (!this.selectedRayon) {
                return this.priceHistory;
            }
            return this.priceHistory.filter(entry => entry.rayon === this.selectedRayon);
        },
    },
    methods: {
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
        async saveData() {
            await fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.priceHistory),
            });
        },
        async loadData() {
            const response = await fetch('/data.json');
            if (response.ok) {
                this.priceHistory = await response.json();
                // Ajout de la propriété "isEditing" à chaque entrée
                this.priceHistory.forEach(entry => (entry.isEditing = false));
            }
        },
        editEntry(index) {
            // Activer le mode édition et sauvegarder une copie des données
            this.priceHistory[index].isEditing = true;
            this.backupEntry = { ...this.priceHistory[index] };
        },
        saveEdit(index) {
            // Désactiver le mode édition et sauvegarder les modifications
            this.priceHistory[index].isEditing = false;
            this.backupEntry = null;
            this.saveData();
        },
        cancelEdit(index) {
            // Annuler les modifications et restaurer les données
            this.priceHistory[index] = { ...this.backupEntry };
            this.priceHistory[index].isEditing = false;
            this.backupEntry = null;
        },
        confirmDelete(index) {
            const confirmed = confirm(`Are you sure you want to delete the product "${this.priceHistory[index].product}"?`);
            if (confirmed) {
                this.deleteEntry(index);
            }
        },
        async deleteEntry(index) {
            this.priceHistory.splice(index, 1);
            await this.saveData();
        },
    },
    async mounted() {
        await this.loadData();
    },
}).mount('#app');
