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
            productSuggestions: [],
            productIDSuggestions: [],
            searchIDSuggestions: [],
            showProductSuggestions: false,
            showProductIDSuggestions: false,
            showSearchIDSuggestions: false,
            backupEntry: null,
            showModal: false,
            tasks: ['Nettoyer', 'Mise en rayon', 'Facing', 'Prix', 'Autre tâche'], // Toutes les tâches visibles
            tasksSelected: [], // Tâches sélectionnées uniquement
            taskModalVisible: false,
            newTask: ''
        };
    },
    computed: {
        uniqueRayons() {
            return [...new Set(this.priceHistory.map(entry => entry.rayon))];
        },
        filteredHistory() {
            let filtered = this.priceHistory;

            if (this.searchID) {
                filtered = filtered.filter(entry => entry.id.toString().includes(this.searchID));
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
        toggleTask(task) {
            const index = this.tasksSelected.indexOf(task);
            if (index === -1) {
                // Ajouter la tâche à la liste des tâches sélectionnées
                this.tasksSelected.push(task);
            } else {
                // Supprimer la tâche de la liste des tâches sélectionnées
                this.tasksSelected.splice(index, 1);
            }
        },
        isTaskSelected(task) {
            return this.tasksSelected.includes(task);
        },
        addNewTask() {
            if (this.newTask.trim() !== '') {
                const task = this.newTask.trim();
                if (!this.tasks.includes(task)) {
                    this.tasks.push(task); // Ajoute à toutes les tâches visibles
                }
                this.newTask = ''; // Réinitialise le champ
                this.taskModalVisible = false; // Ferme le modal
            }
        },
        formatDate(dateStr, isInput = false) {
            const [year, month, day] = isInput
                ? dateStr.split('-')
                : dateStr.split('/').reverse();
            return `${day}/${month}/${year}`;
        },
        filterProducts() {
            const searchQuery = this.newEntry.product.toLowerCase().trim();
            this.productSuggestions = this.priceHistory.filter(product =>
                product.product.toLowerCase().includes(searchQuery)
            );
            this.showProductSuggestions = this.productSuggestions.length > 0;
        },
        filterProductIDs() {
            const searchQuery = this.newEntry.id.toLowerCase().trim();
            this.productIDSuggestions = this.priceHistory.filter(entry =>
                entry.id.toString().toLowerCase().includes(searchQuery)
            );
            this.showProductIDSuggestions = this.productIDSuggestions.length > 0;
        },
        filterSearchIDs() {
            const searchQuery = this.searchID.toLowerCase().trim();
            this.searchIDSuggestions = this.priceHistory.filter(entry =>
                entry.id.toString().toLowerCase().includes(searchQuery)
            );
            this.showSearchIDSuggestions = this.searchIDSuggestions.length > 0;
        },
        selectProduct(product) {
            this.newEntry.id = product.id;
            this.newEntry.product = product.product;
            this.newEntry.newPrice = product.newPrice;
            this.newEntry.rayon = product.rayon;
            this.showProductSuggestions = false;
            this.showProductIDSuggestions = false;
        },
        selectID(entry) {
            this.searchID = entry.id;
            this.showSearchIDSuggestions = false;
        },
        hideSuggestions() {
            setTimeout(() => {
                this.showProductSuggestions = false;
                this.showProductIDSuggestions = false;
                this.showSearchIDSuggestions = false;
            }, 200);
        },
        editEntry(index) {
            this.backupEntry = { ...this.priceHistory[index] };
            this.priceHistory[index].isEditing = true;
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
        confirmDelete(index) {
            if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
                this.deleteEntry(index);
            }
        },
        deleteEntry(index) {
            this.priceHistory.splice(index, 1);
            this.saveData();
        },
        async updatePrice() {
            const currentDate = new Date().toLocaleDateString('fr-FR');

            const existingEntryIndex = this.priceHistory.findIndex(entry => entry.id === this.newEntry.id);

            if (existingEntryIndex !== -1) {
                this.priceHistory[existingEntryIndex] = {
                    ...this.priceHistory[existingEntryIndex],
                    newPrice: parseFloat(this.newEntry.newPrice).toFixed(2),
                    date: currentDate,
                };
            } else {
                const entry = {
                    id: this.newEntry.id || Date.now().toString(),
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
                id: this.modalEntry.id || Date.now().toString(),
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
        openTaskModal() {
            this.taskModalVisible = true;
        },
        closeTaskModal() {
            this.taskModalVisible = false;
        },
        async saveData() {
            try {
                const response = await fetch('/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.priceHistory),
                });
                if (!response.ok) {
                    console.error('Erreur lors de la sauvegarde :', response.statusText);
                }
            } catch (error) {
                console.error('Impossible de se connecter au serveur :', error);
            }
        },
        async loadData() {
            try {
                const response = await fetch('./data.json');
                if (response.ok) {
                    this.priceHistory = await response.json();
                    this.priceHistory.forEach(entry => (entry.isEditing = false));
                } else {
                    console.warn('Fichier data.json introuvable.');
                    this.priceHistory = [];
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données :', error);
                this.priceHistory = [];
            }
        },
        generatePDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.text('Suivi des prix', 105, 10, { align: 'center' });

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

            doc.text('Tâches sélectionnées :', 10, doc.lastAutoTable.finalY + 10);
            this.tasksSelected.forEach((task, index) => {
                doc.text(`${index + 1}. ${task}`, 10, doc.lastAutoTable.finalY + 20 + index * 10);
            });

            doc.save('Suivi_Prix.pdf');
        },
    },
    async mounted() {
        await this.loadData();
    },
}).mount('#app');
