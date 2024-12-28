const { createApp } = Vue;

createApp({
    data() {
        return {
            priceHistory: [],
            newEntry: {
                id: '',
                product: '',
                newPrice: '',
                rayon: '',
            },
            modalEntry: {
                id: '',
                product: '',
                newPrice: '',
                rayon: '',
            },
            searchID: '',
            selectedRayon: '',
            selectedDate: '',
            filteredSuggestions: [],
            backupEntry: null,
            showModal: false,
        };
    },
    computed: {
        uniqueRayons() {
            return [...new Set(this.priceHistory.map(entry => entry.rayon))];
        },
        filteredHistory() {
            let filtered = this.priceHistory;

            // Recherche par ID
            if (this.searchID) {
                filtered = filtered.filter(entry => entry.id.toString() === this.searchID);
            }

            if (this.selectedRayon) {
                filtered = filtered.filter(entry => entry.rayon === this.selectedRayon);
            }

            if (this.selectedDate) {
                filtered = filtered.filter(entry => {
                    return this.formatDate(entry.date) === this.formatDate(this.selectedDate, true);
                });
            }

            return filtered;
        },
    },
    methods: {
        formatDate(dateStr, isInput = false) {
            const [year, month, day] = isInput
                ? dateStr.split('-')
                : dateStr.split('/').reverse();
            return `${day}/${month}/${year}`;
        },
        filterProducts() {
            const searchQuery = this.newEntry.product.toLowerCase();
            this.filteredSuggestions = this.priceHistory.filter(product =>
                product.product.toLowerCase().includes(searchQuery)
            );
        },
        selectProduct(product) {
            this.newEntry.id = product.id;
            this.newEntry.product = product.product;
            this.newEntry.newPrice = product.newPrice;
            this.newEntry.rayon = product.rayon;
            this.filteredSuggestions = [];
        },
        async updatePrice() {
            const currentDate = new Date().toLocaleDateString('fr-FR');

            // Trouver l'entrée existante
            const existingEntryIndex = this.priceHistory.findIndex(entry => entry.id === this.newEntry.id);

            if (existingEntryIndex !== -1) {
                // Mise à jour de l'entrée existante
                this.priceHistory[existingEntryIndex] = {
                    ...this.priceHistory[existingEntryIndex],
                    newPrice: parseFloat(this.newEntry.newPrice).toFixed(2),
                    date: currentDate,
                };
            } else {
                // Nouvelle entrée
                const entry = {
                    id: this.newEntry.id || Date.now(),
                    product: this.newEntry.product,
                    oldPrice: "N/A",
                    newPrice: parseFloat(this.newEntry.newPrice).toFixed(2),
                    rayon: this.newEntry.rayon,
                    date: currentDate,
                    isEditing: false,
                };
                this.priceHistory.push(entry);
            }

            this.newEntry = { id: '', product: '', newPrice: '', rayon: '' };
            await this.saveData();
        },
        async addProduct() {
            const currentDate = new Date().toLocaleDateString('fr-FR');
            const entry = {
                id: this.modalEntry.id || Date.now(),
                product: this.modalEntry.product,
                oldPrice: "N/A",
                newPrice: parseFloat(this.modalEntry.newPrice).toFixed(2),
                rayon: this.modalEntry.rayon,
                date: currentDate,
                isEditing: false,
            };
            this.priceHistory.push(entry);
            this.modalEntry = { id: '', product: '', newPrice: '', rayon: '' };
            this.showModal = false;
            await this.saveData();
        },
        openModal() {
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
        },
        saveData() {
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
        confirmDelete(index) {
            if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
                this.deleteEntry(index);
            }
        },
        generatePDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.text('Suivie des prix', 105, 10, { align: 'center' });

            const tableColumns = ['ID', 'Produit', 'Rayon', 'Prix Ancien', 'Prix Nouveau', 'Date'];
            const tableRows = this.filteredHistory.map(entry => [
                entry.id,
                entry.product,
                entry.rayon,
                entry.oldPrice,
                entry.newPrice,
                this.formatDate(entry.date),
            ]);

            doc.autoTable({
                head: [tableColumns],
                body: tableRows,
                startY: 20,
                theme: 'striped',
            });

            doc.save('Suivie_Prix.pdf');
        },
    },
    async mounted() {
        await this.loadData();
    },
}).mount('#app');